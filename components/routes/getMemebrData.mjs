import {
  decryptMessage,
  errorHand,
  set_data_in_database,
  verifyToken,
} from "../core/utils.mjs";

const getMemebrData = async (req, res) => {
  const { id } = req.query;
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
      await set_data_in_database(`SELECT * FROM members WHERE id=?`, [id])
    )[0];

    Object.keys(member_res).forEach((item) => {
      if (item !== "id") member_res[item] = decryptMessage(member_res[item]);
    });
    res.status(200).json(member_res);
  } catch (err) {
    errorHand(err);

    res.status(500).send("Server Error");
  }
};
export default getMemebrData;
