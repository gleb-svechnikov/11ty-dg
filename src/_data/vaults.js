import garden from "../../garden.config.js";

export default garden.vaults.map((vault) => ({
  ...vault,
  title: vault.title ?? vault.id.replace(/-/g, " "),
}));
