import { errorHand } from "../core/utils.mjs";

const getUpdate = async (req, res, next) => {
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
    if (user_res) {
      let result = await getBackUp();
      if (typeof result === "boolean")
        res.send(
          "<div style='text-aligh:center;padding:10px;background:green;color:white'>success</div>"
        );
      else
        res.send(
          "<div style='text-aligh:center;padding:10px;background:red;color:white'>faild " +
            result +
            " days</div>"
        );
    } else {
      let path = "pages/login.html";
      let data = fs.readFileSync(path, "utf8");
      data = data.replace(/\?\=\d+\"/g, "?=" + Math.random() + '"');
      res.send(data);
    }
  } catch (err) {
    errorHand(err);

    next();
    res.status(500).send("Server Error");
  }
};
export default getUpdate;
