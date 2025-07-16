import { cookie, moment } from "../core/settings.mjs";
import {
  encryptMessage,
  errorHand,
  isValidJalaliDate,
  modifyUser,
  set_data_in_database,
  verifyToken,
} from "../core/utils.mjs";

const submitNewMember = async (req, res) => {
  try {
    const cookies = req.headers.cookie;
    let client_cookie = {};
    if (cookies) {
      client_cookie = cookie.parse(cookies);
    }
    if (!req.cookies["user"]) return;
    let user = JSON.parse(req.cookies["user"]);
    let isEmpty = false;
    for (const key in req.body) {
      req.body[key] = String(req.body[key]).trim();
      if (!req.body[key] && req.body[key] != 0) isEmpty = true;
    }
    if (isEmpty || !Number(req.body.number)) {
      return res.status(400).json({ message: "همه ی فیلد ها را پر کنید" });
    }

    let user_res = await (
      await set_data_in_database(
        `SELECT * FROM users WHERE username=?`,
        user.username
      )
    )[0];

    if (!verifyToken(JSON.parse(client_cookie.user).key, user_res.user_key)) {
      res.cookie("user", "");
      res.status(406).json({
        message: "لطفا دوباره لاگین کنید.",
      });
      return;
    }

    if (user_res) {
      const checkExist = await set_data_in_database(
        `SELECT COUNT(*) as count FROM members WHERE nationalId = ?`,
        [encryptMessage(req.body.nationalId)]
      );
      if (checkExist[0].count > 0) {
        res
          .status(404)
          .json({ message: `عضو در سیستم وجود دارد.`, status: false });
        return;
      }
      let keyOfObject = ["editedBy"];
      let isAllow = { status: true, message: "" };
      for (const key in req.body) {
        if (key === "birthDayDate" || key === "dateSchoolSift") {
          if (!isValidJalaliDate(req.body[key])) {
            isAllow = {
              status: false,
              message: `فرمت تاریخ ${
                key === "dateSchoolSift" ? "شیفت" : "تاریخ تولد"
              } نا معتبر است.`,
            };
          } else keyOfObject.push(key);
          if (key === "dateSchoolSift")
            if (moment(req.body[key], "jYYYY/jMM/jDD").weekday() === 5) {
              isAllow = {
                status: false,
                message:
                  "لطفا تاریخ شیفت را از شنبه تا چهارشنبه یا پنجشنبه انتخاب کنید.",
              };
            }
        } else {
          keyOfObject.push(key);
        }
      }
      if (!isAllow.status)
        return res
          .status(406)
          .json({ status: false, message: isAllow.message });

      let member_res = await set_data_in_database(
        `INSERT INTO members(${keyOfObject.join(",")}) VALUES(
    ${keyOfObject
      .map((item, index) => {
        return (item = "?");
      })
      .join(",")}
)
     `,
        keyOfObject.map((item, index) => {
          item = encryptMessage(
            item === "editedBy" ? user_res.username : req.body[item]
          );

          return item;
        })
      );
      if (member_res.affectedRows == 0) {
        res.status(404).json({ message: `مشکل در سیستم.`, status: false });
        return;
      }
      user_res = await modifyUser(
        encryptMessage(req.body.nationalId),
        user_res.username,
        1
      );
      if (!user_res) {
        res.status(404).json({ message: `مشکل در سیستم.`, status: false });
        return;
      }
      res.status(200).json({
        message: "عضو در سیستم ثبت شد.",
        status: true,
      });
    } else res.status(404).json({ message: `کاربر یافت نشد.`, status: false });
  } catch (e) {
    errorHand(e);
    console.error(e);
    res.status(500).send("Server Error");
  }
};
export default submitNewMember;
