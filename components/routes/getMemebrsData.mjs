import { decryptMessage, errorHand, set_data_in_database, verifyToken } from "../core/utils.mjs";

const getMemebrsData = async (req, res) => {
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
    let member_res = await set_data_in_database(`SELECT * FROM members `);
    let arrays = {};
    Object.values(member_res).forEach((item) => {
      Object.keys(item).forEach((key) => {
        if (
          key === "educationalBase" ||
          key === "schoolDays" ||
          key === "birthDayDate"
        ) {
          item[key] = decryptMessage(item[key]);
          if (!arrays[key]) arrays[key] = [];
          arrays[key].push(item[key]);
        }
      });
    });
    res.status(200).json(arrays);
  } catch (err) {
    errorHand(err);

    res.status(500).send("Server Error");
  }
};
export default getMemebrsData;
