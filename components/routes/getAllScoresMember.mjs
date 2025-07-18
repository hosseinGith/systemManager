import moment from "moment-jalaali";
import {
  decryptMessage,
  errorHand,
  set_data_in_database,
  verifyToken,
} from "../core/utils.mjs";
import { books } from "../core/settings.mjs";

function samAObject(scores, item) {
  if (!scores[item.bookName]) {
    scores[item.bookName] = {
      mostamarClass: { value: 0, numberOfIncress: 0 },
      mostamar: { value: 0, numberOfIncress: 0 },
      middleOwn: { value: 0, numberOfIncress: 0 },
      middleTow: { value: 0, numberOfIncress: 0 },
    };
  }

  scores[item.bookName][item.scoreType].value += item.score;
  scores[item.bookName][item.scoreType].numberOfIncress++;
  return scores;
}

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
    member_res.nationalId = decryptMessage(member_res.nationalId);

    let values_res = await set_data_in_database(
      `SELECT * FROM educationalbasescores WHERE memberNationalId=BINARY ? `,
      [member_res.nationalId, data.educationalBaseAddScore]
    );
    let reshteBooks = books[member_res.educationalBase];
    if (data.reshteSelect) reshteBooks = reshteBooks[data.reshteSelect];
    if (!values_res)
      return res.status(404).json({
        status: false,
        message: "مشکل در سیستم.",
      });
    if (data.type === "all") {
      let values = {
        allData: {},
        allBooks: values_res.length > 0 ? reshteBooks : [],
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
          moment(data.dateTo, type).diff(moment(item.date, type), "days") >=
            0 &&
          Object.keys(books).findIndex((it) => it === item.educationalBase) >=
            Object.keys(books).findIndex(
              (it) => it === data.educationalBaseAddScore
            )
        ) {
          if (!values.allData[item.bookName])
            values.allData[item.bookName] = [];
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
      values = null;
    } else if (data.type === "schoole") {
      let scores = {};
      values_res.forEach((item, index) => {
        scores = samAObject(scores, item);
      });

      Object.keys(scores).forEach((item) => {
        scores[item].mostamarClass =
          scores[item].mostamarClass.value /
          scores[item].mostamarClass.numberOfIncress;

        scores[item].mostamar =
          scores[item].mostamar.value / scores[item].mostamar.numberOfIncress;

        scores[item].middleOwn =
          scores[item].middleOwn.value / scores[item].middleOwn.numberOfIncress;

        scores[item].middleTow =
          scores[item].middleTow.value / scores[item].middleTow.numberOfIncress;
      });
      res.status(200).json({
        status: true,
        scores,
      });
      // middleTowTotal;
      // mostamar;
    }

    values_res = null;
  } catch (err) {
    errorHand(err);

    res.status(500).send("Server Error");
  }
};
export default getAllScoresMember;
