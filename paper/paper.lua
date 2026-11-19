-- Pandoc filter: turn the Obsidian note into a two-column paper.
-- * first H1 -> title, "## Abstract" section -> full-width abstract
-- * headings shifted up one level (## -> \section)
-- * Obsidian callouts -> shaded boxes, mermaid -> TikZ figure (figure*)
-- * tables -> full-width table*, code -> listings, references -> hanging list

local stringify = pandoc.utils.stringify

local function latex(blocks)
  return pandoc.write(pandoc.Pandoc(blocks), 'latex'):gsub('%s+$', '')
end

-- Frontmatter `keywords:` is a list. The two-column PDF prints it under the
-- abstract as two columns, read down the left column and then the right.
local function keywords_block(meta)
  local kw = meta.keywords
  -- Pandoc 3 stores a YAML list as a List; it has no `.t` field.
  if pandoc.utils.type(kw) ~= 'List' then return '' end
  local items = {}
  for _, item in ipairs(kw) do
    local s = stringify(item):gsub('^%s+', ''):gsub('%s+$', '')
    if s ~= '' then items[#items + 1] = latex({ pandoc.Plain(pandoc.Str(s)) }) end
  end
  if #items == 0 then return '' end
  local mid = math.ceil(#items / 2)
  local rows = {}
  for i = 1, mid do
    rows[#rows + 1] = items[i] .. ' & ' .. (items[i + mid] or '') .. ' \\\\'
  end
  return [[
\vspace{0.55em}
\begin{center}\begin{minipage}{0.86\textwidth}\small
\textbf{Keywords}\par\vspace{0.25em}
\noindent\begin{tabular}{@{}>{\raggedright\arraybackslash}p{0.46\linewidth}@{\hspace{0.08\linewidth}}>{\raggedright\arraybackslash}p{0.46\linewidth}@{}}
]] .. table.concat(rows, '\n') .. [[

\end{tabular}
\end{minipage}\end{center}]]
end

local CALLOUT_COLORS = {
  important = 'c-important', warning = 'c-important', caution = 'c-important',
  info = 'c-info', note = 'c-info', tip = 'c-tip',
}

local elements = {}

function elements.Str(s)
  local t = s.text:gsub('%*%*%*%*$', '')
  -- STIX General has no italic arrow; typeset it as math.
  if t:find('→', 1, true) then
    local out = {}
    local first = true
    for part in (t .. '→'):gmatch('(.-)→') do
      if not first then out[#out + 1] = pandoc.RawInline('latex', '$\\rightarrow$') end
      if part ~= '' then out[#out + 1] = pandoc.Str(part) end
      first = false
    end
    return out
  end
  if t ~= s.text then return pandoc.Str(t) end
end

local function callout(kind, label, body)
  local color = CALLOUT_COLORS[kind] or 'c-info'
  label = label or (kind:sub(1, 1):upper() .. kind:sub(2))
  return pandoc.RawBlock('latex',
    '\\begin{callout}{' .. color .. '}{' .. label .. '}\n' .. latex(body) .. '\n\\end{callout}')
end

-- GitHub-style alerts (note/tip/important/warning/caution) arrive as Divs.
function elements.Div(div)
  local kind = div.classes[1]
  if not (kind and CALLOUT_COLORS[kind]) then return nil end
  local label, body = nil, {}
  for _, b in ipairs(div.content) do
    if b.t == 'Div' and b.classes:includes('title') then
      label = stringify(b)
    else
      body[#body + 1] = b
    end
  end
  return callout(kind, label, body)
end

-- Other Obsidian callouts (e.g. [!info]) stay block quotes starting with "[!kind]".
function elements.BlockQuote(bq)
  local first = bq.content[1]
  if not (first and first.t == 'Para' and first.content[1] and first.content[1].t == 'Str') then return nil end
  local kind = first.content[1].text:match('^%[!(%w+)%]$')
  if not kind then return nil end
  local inl = first.content
  inl:remove(1)
  while inl[1] and (inl[1].t == 'Space' or inl[1].t == 'SoftBreak') do inl:remove(1) end
  local body = pandoc.List(bq.content)
  if #inl == 0 then body:remove(1) end
  return callout(kind:lower(), nil, body)
end

-- "text:\n    - item\n    - item" is read as one paragraph (lazy continuation);
-- turn the "- " lines back into a bullet list.
function elements.Para(p)
  local segs, cur = {}, pandoc.List()
  local c = p.content
  local i = 1
  while i <= #c do
    if c[i].t == 'SoftBreak' and c[i + 1] and c[i + 1].t == 'Str' and c[i + 1].text == '-'
       and c[i + 2] and c[i + 2].t == 'Space' then
      segs[#segs + 1] = cur
      cur = pandoc.List()
      i = i + 3
    else
      cur:insert(c[i])
      i = i + 1
    end
  end
  segs[#segs + 1] = cur
  if #segs < 3 then return nil end
  local items = {}
  for k = 2, #segs do items[#items + 1] = { pandoc.Plain(segs[k]) } end
  return { pandoc.Para(segs[1]), pandoc.BulletList(items) }
end

function elements.CodeBlock(cb)
  if cb.classes:includes('mermaid') then
    return pandoc.RawBlock('latex', [[
\begin{figure*}[t]
\centering
\input{workflow-diagram.tex}
\caption{The workflow is centred on the knowledge base of concept notes and their links. Captured material is processed and connected into it, planning and teaching draw from it, improvement returns to it, and sharing and export publish from it.}
\label{fig:workflow}
\end{figure*}]])
  end
  -- An indented list that the parser read as an indented code block.
  if #cb.classes == 0 and cb.text:match('^%s*%- ') then
    local text = cb.text:gsub('\n%s+', '\n'):gsub('^%s+', '')
    return pandoc.read(text, 'commonmark_x').blocks
  end
  return pandoc.RawBlock('latex', '\\begin{lstlisting}\n' .. cb.text .. '\n\\end{lstlisting}')
end

local function is_agents_table(tbl)
  if #tbl.colspecs ~= 3 then return false end
  local heads = {}
  for _, row in ipairs(tbl.head.rows) do
    for _, cell in ipairs(row.cells) do
      heads[#heads + 1] = stringify(cell.contents)
    end
  end
  return heads[1] == 'Stage' and heads[3] == 'Teacher keeps'
end

function elements.Table(tbl)
  local ncols = #tbl.colspecs
  -- A one-cell pipe block is prose pasted as a table (a reference, not a table).
  if ncols == 1 then
    local blocks = {}
    local function take(row)
      for _, cell in ipairs(row.cells) do
        for _, b in ipairs(cell.contents) do
          if stringify(b):match('%S') then blocks[#blocks + 1] = b end
        end
      end
    end
    for _, row in ipairs(tbl.head.rows) do take(row) end
    for _, body in ipairs(tbl.bodies) do
      for _, row in ipairs(body.body) do take(row) end
    end
    return blocks
  end
  local function row_tex(row)
    local cells = {}
    for _, cell in ipairs(row.cells) do
      cells[#cells + 1] = latex(cell.contents)
    end
    return table.concat(cells, ' & ') .. ' \\\\'
  end
  local spec = '@{}>{\\raggedright\\arraybackslash}p{0.16\\textwidth}'
  for _ = 2, ncols do spec = spec .. '>{\\raggedright\\arraybackslash}X' end
  spec = spec .. '@{}'
  local caption = nil
  if #tbl.caption.long > 0 then
    caption = latex(tbl.caption.long)
  elseif is_agents_table(tbl) then
    caption = 'Where AI agents help at each stage of the workflow, and what the teacher keeps.'
  end
  local lines = {
    '\\begin{table*}[t]', '\\centering\\small',
  }
  if caption then lines[#lines + 1] = '\\caption{' .. caption .. '}' end
  lines[#lines + 1] = '\\begin{tabularx}{\\textwidth}{' .. spec .. '}'
  lines[#lines + 1] = '\\toprule'
  for _, row in ipairs(tbl.head.rows) do
    local cells = {}
    for _, cell in ipairs(row.cells) do
      cells[#cells + 1] = '\\textbf{' .. latex(cell.contents) .. '}'
    end
    lines[#lines + 1] = table.concat(cells, ' & ') .. ' \\\\'
  end
  lines[#lines + 1] = '\\midrule'
  for _, body in ipairs(tbl.bodies) do
    for _, row in ipairs(body.body) do lines[#lines + 1] = row_tex(row) end
  end
  lines[#lines + 1] = '\\bottomrule'
  lines[#lines + 1] = '\\end{tabularx}'
  lines[#lines + 1] = '\\end{table*}'
  return pandoc.RawBlock('latex', table.concat(lines, '\n'))
end

-- Split a paragraph of "[n] ..." lines into one paragraph per reference.
local function split_refs(para)
  local refs, cur = {}, {}
  local function flush()
    if #cur > 0 then
      table.insert(cur, 1, pandoc.RawInline('latex', '\\noindent\\hangindent=1.8em\\hangafter=1 '))
      refs[#refs + 1] = pandoc.Para(cur)
      cur = {}
    end
  end
  for i, el in ipairs(para.content) do
    local nxt = para.content[i + 1]
    if (el.t == 'SoftBreak' or el.t == 'LineBreak') and nxt and nxt.t == 'Str' and nxt.text:match('^%[%d+%]') then
      flush()
    else
      cur[#cur + 1] = el
    end
  end
  flush()
  return refs
end

local structure = {}

function structure.Pandoc(doc)
  local out, abstract, title = {}, {}, nil
  local mode = nil
  for _, b in ipairs(doc.blocks) do
    if b.t == 'Header' and b.level == 1 and not title then
      title = b.content
    elseif b.t == 'Header' and b.level == 2 and stringify(b) == 'Abstract' then
      mode = 'abstract'
    elseif b.t == 'Header' and b.level <= 2 then
      mode = stringify(b) == 'References' and 'refs' or nil
      out[#out + 1] = b
      if mode == 'refs' then
        out[#out + 1] = pandoc.RawBlock('latex', '\\begingroup\\small\\setlength{\\parskip}{2pt}')
      end
    elseif mode == 'abstract' then
      abstract[#abstract + 1] = b
    elseif mode == 'refs' and b.t == 'Para' then
      for _, r in ipairs(split_refs(b)) do out[#out + 1] = r end
    else
      out[#out + 1] = b
    end
  end
  if mode == 'refs' then out[#out + 1] = pandoc.RawBlock('latex', '\\endgroup') end

  -- Shift headings: ## -> section, ### -> subsection.
  for i, b in ipairs(out) do
    if b.t == 'Header' then
      b.level = math.max(1, b.level - 1)
      out[i] = b
    end
  end

  local meta = doc.meta
  local author = meta.author and stringify(meta.author) or 'Gleb Svechnikov'
  local date = meta.date and stringify(meta.date) or os.date('%B %Y')
  local title_tex = title and latex({ pandoc.Plain(title) }) or ''
  if meta.subtitle then
    title_tex = title_tex .. '\\par}\\vspace{0.4em}{\\Large '
      .. latex({ pandoc.Plain(pandoc.Inlines(meta.subtitle)) })
  end
  local head = string.format([[
\hypersetup{pdftitle={%s},pdfauthor={%s}}
\twocolumn[{%%
\begin{center}
{\LARGE\bfseries %s\par}\vspace{0.9em}
{\large %s\par}\vspace{0.3em}
{\small %s\par}
\end{center}
\vspace{0.4em}
\begin{center}\begin{minipage}{0.86\textwidth}\small\setlength{\parskip}{0.45em}
\textbf{Abstract.}\enspace %s
\end{minipage}\end{center}
%s
\vspace{1.2em}}]
]], stringify(title or ''), author, title_tex, author, date, latex(abstract), keywords_block(meta))
  table.insert(out, 1, pandoc.RawBlock('latex', head))
  meta.title = nil
  meta.subtitle = nil
  meta.author = nil
  meta.date = nil
  return pandoc.Pandoc(out, meta)
end

return { elements, structure }
