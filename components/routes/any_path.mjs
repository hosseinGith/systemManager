import { fs } from "../core/settings.mjs";
import { errorHand, set_data_in_database, verifyToken } from "../core/utils.mjs";

const any_path = async (req, res, next) => {
  try {
    let user_res;
    if (req.cookies.user) {
      let cookieUser = JSON.parse(req.cookies.user);
      user_res = await (
        await set_data_in_database(
          `SELECT * FROM users WHERE username=?`,
          cookieUser.username
        )
      )[0];
    }
    if (user_res)
      if (!verifyToken(JSON.parse(req.cookies.user).key, user_res.user_key)) {
        res.cookie("user", "");
        res.cookie("users", "");
        user_res = "";
      }

    let path = !user_res ? "pages/login.html" : "pages/index.html";
    let data = fs.readFileSync(path, "utf8");
    data = data.replace(/\?\=\d+\"/g, "?=" + Math.random() + '"');
     res.send(data);
  } catch (err) {
    errorHand(err);
    res.status(500).send("Server Error");
    next();
  }
};
export default any_path;
