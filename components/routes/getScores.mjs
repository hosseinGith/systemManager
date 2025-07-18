import moment from "moment-jalaali";
import {
  decryptMessage,
  errorHand,
  set_data_in_database,
  verifyToken,
} from "../core/utils.mjs";
import { books } from "../core/settings.mjs";

const getScores = async (req, res) => {
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
      await set_data_in_database(`SELECT nationalId FROM members WHERE id=?`, [
        id,
      ])
    )[0];

    if (!member_res)
      return res.status(404).json({
        status: false,
        message: "کاربر مورد نظر در سیستم وجود ندارد.",
      });

    let values_res = await set_data_in_database(
      `SELECT * FROM educationalbasescores WHERE memberNationalId=BINARY ? AND bookName =BINARY ? `,
      [decryptMessage(member_res.nationalId), data.bookName]
    );
    if (!values_res)
      return res.status(404).json({
        status: false,
        message: "مشکل در سیستم.",
      });

    let values = {
      date: [],
      score: [],
    };
    const type = "jYYYY/jMM/jDD";

    values_res.forEach((item) => {
      if (
        moment(item.date, type).diff(moment(data.dateFrom, type), "days") >=
          0 &&
        moment(data.dateTo, type).diff(moment(item.date, type), "days") >= 0 &&
        Object.keys(books).findIndex((it) => it === item.educationalBase) >=
          Object.keys(books).findIndex(
            (it) => it === data.educationalBaseAddScore
          )
      ) {
        values.date.push(item.date);
        values.score.push(item.score);
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
export default getScores;
