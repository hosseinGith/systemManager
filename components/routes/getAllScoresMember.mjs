import moment from "moment-jalaali";
import {
  decryptMessage,
  errorHand,
  set_data_in_database,
  verifyToken,
} from "../core/utils.mjs";
import { books } from "../core/settings.mjs";

const getAllScoresMember = async (req, res) => {
  const { id } = req.params;
  const data = req.body;
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

    if (!member_res)
      return res.status(404).json({
        status: false,
        message: "کاربر مورد نظر در سیستم وجود ندارد.",
      });
    member_res.firstName = decryptMessage(member_res.firstName);
    member_res.lastName = decryptMessage(member_res.lastName);
    member_res.educationalBase = decryptMessage(member_res.educationalBase);
    console.log(data.educationalBaseAddScore);

    let values_res = await set_data_in_database(
      `SELECT * FROM educationalbasescores WHERE memberNationalId=BINARY ? AND educationalBase = BINARY ? `,
      [decryptMessage(member_res.nationalId), data.educationalBaseAddScore]
    );
    console.log(values_res);

    if (!values_res)
      return res.status(404).json({
        status: false,
        message: "مشکل در سیستم.",
      });

    let values = {
      allData: {},
      allBooks: values_res.length > 0 ? books[member_res.educationalBase] : [],
      firstName: member_res.firstName,
      lastName: member_res.lastName,
      educationalBase: member_res.educationalBase,
      educationalDate:
        Number(Number(moment(data.dateFrom).get("year")) + 1) +
        "-" +
        moment(data.dateFrom).get("year"),
    };
    const type = "jYYYY/jMM/jDD";
    values_res.forEach((item) => {
      if (
        moment(item.date, type).diff(moment(data.dateFrom, type), "days") >=
          0 &&
        moment(data.dateTo, type).diff(moment(item.date, type), "days") >= 0
      ) {
        if (!values.allData[item.bookName]) values.allData[item.bookName] = [];
        values.allData[item.bookName].push({
          date: item.date,
          score: item.score,
        });
      }
    });

    res.status(200).json({
      status: true,
      values,
    });
    values_res = null;
    values = null;
  } catch (err) {
    errorHand(err);

    res.status(500).send("Server Error");
  }
};
export default getAllScoresMember;
