import { fs } from "../core/settings.mjs";
import { errorHand } from "../core/utils.mjs";

const login = async (req, res) => {
  try {
    let path = "login.html";
    let data = fs.readFileSync(path, "utf8");
    data = data.replace(/\?\=\d+\"/g, "?=" + Math.random() + '"');
    res.send(data);
  } catch (err) {
    errorHand(err);

    res.status(500).send("Server Error");
  }
};
export default login;
