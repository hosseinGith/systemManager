import moment from "moment-jalaali";
import {
  checkUserAthu,
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
      mostamarTow: { value: 0, numberOfIncress: 0 },
      middleTow: { value: 0, numberOfIncress: 0 },
    };
  }

  scores[item.bookName][item.scoreType].value += item.score;
  scores[item.bookName][item.scoreType].numberOfIncress++;
  return scores;
}

const getAllScoresMember = async (req, res) => {
  const { id } = req.params;
  const data = req.query;

  try {
    let { user_res, cookieUser } = await checkUserAthu(req, res);
    if (!user_res || !cookieUser) return;

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
    member_res.nationalId = decryptMessage(member_res.nationalId);
    member_res.reshte = decryptMessage(member_res.reshte);

    let reshteBooks = books[data.educationalBaseAddScore];

    if (
      data.reshteSelect &&
      Object.keys(books).findIndex(
        (it) => it === member_res.educationalBaseAddScore
      ) >= 10
    )
      reshteBooks = reshteBooks[data.reshteSelect];

    const type = "jYYYY/jMM/jDD";
    if (data.type === "all") {
      let values_res = await set_data_in_database(
        `SELECT * FROM educationalbasescores WHERE memberNationalId=BINARY ? `,
        [member_res.nationalId]
      );
      if (!values_res)
        return res.status(404).json({
          status: false,
          message: "مشکل در سیستم.",
        });

      let values = {
        allData: [],
        allBooks: values_res.length > 0 ? reshteBooks : [],
        firstName: member_res.firstName,
        lastName: member_res.lastName,
        educationalBase: member_res.educationalBase,
        educationalDate:
          Number(Number(moment(data.dateFrom, type, "fa", true).jYear()) + 1) +
          "-" +
          moment(data.dateFrom, type, "fa", true).jYear(),
      };

      values_res.forEach((item) => {
        const from = moment(data.dateFrom, type, "fa", true);
        const to = moment(data.dateTo, type, "fa", true);
        const itemDate = moment(item.date, type, "fa", true);
        if (
          itemDate.isSameOrAfter(from) &&
          itemDate.isSameOrBefore(to) &&
          Object.keys(books).findIndex((it) => it === item.educationalBase) >=
            Object.keys(books).findIndex(
              (it) => it === data.educationalBaseAddScore
            )
        ) {
          if (
            !values.allData.find(
              (bookdata) => bookdata.lesson === item.bookName
            )
          )
            values.allData.push({
              lesson: item.bookName,
              scores: {},
            });

          let index;
          values.allData.find((bookdata, ind) => {
            if (bookdata.lesson === item.bookName) {
              index = ind;
              return;
            }
          });
          values.allData[index].scores[item.date] = item.score;
        }
      });

      res.status(200).json({
        status: true,
        values,
      });
      values = null;
      values_res = null;
    } else if (data.type === "schoole") {
      let values_res = await set_data_in_database(
        `SELECT * FROM educationalbasescores WHERE memberNationalId=BINARY ? AND educationalBase=BINARY ?`,
        [member_res.nationalId, data.educationalBaseAddScore]
      );
      if (!values_res)
        return res.status(404).json({
          status: false,
          message: "مشکل در سیستم.",
        });
      let scores = {};

      for (let index = 0; index < values_res.length; index++) {
        const item = values_res[index];

        if (item.educationalBase === data.educationalBaseAddScore)
          scores = samAObject(scores, item);
      }

      Object.keys(scores).forEach((item) => {
        scores[item].mostamarClass =
          scores[item].mostamarClass.value /
          scores[item].mostamarClass.numberOfIncress;

        scores[item].mostamar =
          scores[item].mostamar.value / scores[item].mostamar.numberOfIncress;

        scores[item].mostamarTow =
          scores[item].mostamarTow.value /
          scores[item].mostamarTow.numberOfIncress;

        scores[item].middleOwn =
          scores[item].middleOwn.value / scores[item].middleOwn.numberOfIncress;

        scores[item].middleTow =
          scores[item].middleTow.value / scores[item].middleTow.numberOfIncress;
      });
      res.status(200).json({
        status: true,
        scores,
        reshte: member_res.reshte,
      });
      // middleTowTotal;
      // mostamar;
      values_res = null;
    }
  } catch (err) {
    errorHand(err);

    res.status(500).send("Server Error");
  }
};
export default getAllScoresMember;
