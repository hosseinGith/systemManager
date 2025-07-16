import { fs } from "../core/settings.mjs";
import {
  errorHand,
  set_data_in_database,
  verifyToken,
} from "../core/utils.mjs";

const member = async (req, res, next) => {
  const userId = req.params.id;
  try {
    let user_res;
    let cookieUser = {};
    if (req.cookies.user) {
      cookieUser = JSON.parse(req.cookies.user);
      user_res = await (
        await set_data_in_database(`SELECT * FROM users WHERE username=?`, [
          cookieUser.username,
        ])
      )[0];
    }
    if (user_res)
      if (!verifyToken(cookieUser.key, user_res.user_key)) {
        res.cookie("user", "");
        res.cookie("users", "");
        user_res = "";
      }
    let member_res = await (
      await set_data_in_database(
        `SELECT COUNT(*) as count FROM members WHERE id=?`,
        [userId]
      )
    )[0];
    let path = !user_res ? "pages/login.html" : "pages/member.html";
    if (member_res.count === 0 && user_res)
      path = "pages/not-found-member.html";
    let data = fs.readFileSync(path, "utf8");
    data = data.replace(/\?\=\d+\"/g, "?=" + Math.random() + '"');
    res.send(data);
  } catch (err) {
    errorHand(err);

    next();
    res.status(500).send("Server Error");
  }
};
export default member;
