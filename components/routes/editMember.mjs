import moment from "moment-jalaali";
import {
  encryptMessage,
  errorHand,
  isValidJalaliDate,
  modifyUser,
  set_data_in_database,
  verifyToken,
} from "../core/utils.mjs";

const editMember = async (req, res) => {
  const memberId = req.params.id;
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
    console.log(req.body);

    let member_res = await (
      await set_data_in_database(
        `SELECT COUNT(*) as count FROM members WHERE id=?`,
        [memberId]
      )
    )[0];
    if (member_res.count === 0) {
      return res.status(404).json({
        status: false,
        message: "کاربر یافت نشد.",
      });
    }
    let values = [];
    let columns = [];
    let isAllow = { status: true, message: "" };

    Object.keys(req.body).forEach((item) => {
      if (!isAllow) return;
      if (item !== "id") {
        if (item === "birthDayDate" || item === "dateSchoolSift") {
          if (!isValidJalaliDate(req.body[item])) {
            isAllow = {
              status: false,
              message: `فرمت تاریخ ${
                item === "dateSchoolSift" ? "شیفت" : "تاریخ تولد"
              } نا معتبر است.`,
            };
          } else {
            let value = req.body[item];
            value = encryptMessage(value);
            columns.push(`${item} = ?`);
            values.push(value);
            if (item === "dateSchoolSift")
              if (
                moment(
                  req.body[item],
                  "jYYYY/jMM/jDD",
                  "fa",
                  true
                ).weekday() === 5
              ) {
                isAllow = {
                  status: false,
                  message:
                    "لطفا تاریخ شیفت را از شنبه تا چهارشنبه یا پنجشنبه انتخاب کنید.",
                };
                return;
              }
          }
        } else {
          let value = req.body[item];
          value = encryptMessage(value);
          columns.push(`${item} = ?`);
          values.push(value);
        }
      }
    });
    if (!isAllow.status)
      return res.status(406).json({ status: false, message: isAllow.message });

    let query = `UPDATE members SET ${columns.join(", ")}  WHERE id = ?;`;

    let edit_res = await set_data_in_database(query, [...values, memberId]);
    user_res = await modifyUser(
      encryptMessage(req.body.nationalId),
      user_res.username,
      1
    );
    if (edit_res.affectedRows > 0 && user_res)
      res.status(200).json({ status: true });
    else res.status(200).json({ status: false, message: "کاربر ویرایش نشد." });
  } catch (err) {
    errorHand(err);

    res.status(500).send("Server Error");
  }
};
export default editMember;
