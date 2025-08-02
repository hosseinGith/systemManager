import {
  checkUserAthu,
  decryptMessage,
  errorHand,
  set_data_in_database,
  verifyToken,
} from "../core/utils.mjs";

const getMemebrsData = async (req, res) => {
  try {
    let { user_res, cookieUser } = await checkUserAthu(req, res);
    if (!user_res || !cookieUser) return;

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
