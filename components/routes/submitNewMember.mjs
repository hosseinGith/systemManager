import { cookie, moment } from "../core/settings.mjs";
import {
  checkUserAthu,
  decryptMessage,
  encryptMessage,
  errorHand,
  isValidJalaliDate,
  modifyUser,
  sendEmailUserSubmited,
  set_data_in_database,
  verifyToken,
} from "../core/utils.mjs";

const submitNewMember = async (req, res) => {
  try {
    let { user_res, cookieUser } = await checkUserAthu(req, res);
    if (!user_res || !cookieUser) return;

    let goToUserEdit = req.body.goToUserEdit;
    delete req.body.goToUserEdit;

    if (
      Number.isNaN(Number(req.body.nationalId)) ||
      !req.body.firstName ||
      !req.body.lastName
    ) {
      return res.status(400).json({ message: "همه ی فیلد ها را پر کنید" });
    }

    if (user_res) {
      const checkExist = await set_data_in_database(
        `SELECT COUNT(*) as count FROM members WHERE nationalId = ?`,
        [encryptMessage(req.body.nationalId)]
      );
      if (checkExist[0].count > 0) {
        res
          .status(404)
          .json({ message: `عضو در سیستم ثبت شده است.`, status: false });
        return;
      }
      let keyOfObject = ["editedBy"];
      let dec_values = [];
      let isAllow = { status: true, message: "" };
      for (const key in req.body) {
        if (
          (key === "birthDayDate" && req.body[key]) ||
          (key === "dateSchoolSift" && req.body[key])
        ) {
          if (!isValidJalaliDate(req.body[key])) {
            isAllow = {
              status: false,
              message: `فرمت تاریخ ${
                key === "dateSchoolSift" ? "شیفت" : "تاریخ تولد"
              } نا معتبر است.`,
            };
          } else {
            keyOfObject.push(key);

            let data = req.body[key];
            if (key === "member_image_url")
              data = "https://members.maktababadan.ir" + data;
            if (data) dec_values.push(`${key} = ${data}`);
          }
          if (key === "dateSchoolSift")
            if (moment(req.body[key], "jYYYY/jMM/jDD").weekday() === 5) {
              isAllow = {
                status: false,
                message:
                  "لطفا تاریخ شیفت را از شنبه تا چهارشنبه یا پنجشنبه انتخاب کنید.",
              };
            }
        } else if (req.body[key]) {
          keyOfObject.push(key);
          let data = req.body[key];
          if (key === "member_image_url")
            data = "https://members.maktababadan.ir" + data;
          if (data) dec_values.push(`${key} = ${data}`);
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
        return "?";
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
      let user_res_new = await modifyUser(
        encryptMessage(req.body.nationalId),
        user_res.username,
        1
      );
      if (!user_res_new) {
        res.status(404).json({ message: `مشکل در سیستم.`, status: false });
        return;
      }

      const memberId = await (
        await set_data_in_database(
          `SELECT id FROM members WHERE nationalId=?`,
          [encryptMessage(req.body.nationalId)]
        )
      )[0];

      res.status(200).json({
        link: goToUserEdit === "true" ? `/member/${memberId?.id}` : "",
        message: "عضو در سیستم ثبت شد.",
        status: true,
      });
      sendEmailUserSubmited(
        `
اضافه کردن عضو ✅

➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖

عضو : ${req.body.firstName + " " + req.body.lastName}
کد ملی : ${req.body.nationalId}
آیدی ادمین : ${user_res.username}
اضافه شد

توضیحات راجب مقادیر اضافه شده:

${dec_values.join("\n ➖➖➖➖➖➖➖ \n")}

`,
        req
      );
    } else res.status(404).json({ message: `کاربر یافت نشد.`, status: false });
  } catch (e) {
    errorHand(e);
    console.error(e);
    res.status(500).send("Server Error");
  }
};
export default submitNewMember;
