import { errorHand, set_data_in_database, verifyToken } from "../core/utils.mjs";

const columns = async (req, res, next) => {
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
    let columns_res = await await set_data_in_database(`SELECT * FROM columns`);
    if (columns_res) {
      res.status(200).json({
        status: true,
        columns: columns_res,
      });
    } else {
      res.status(500).json({
        status: false,
      });
    }
  } catch (err) {
    errorHand(err);

    next();
    res.status(500).send("Server Error");
  }
};
export default columns;
