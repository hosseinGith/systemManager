import { cookie, moment } from "../core/settings.mjs";
import {
  decryptMessage,
  set_data_in_database,
  verifyToken,
} from "../core/utils.mjs";

const search = async (req, res) => {
  let { textSearch, type } = req.body;

  const cookies = req.headers.cookie;
  let client_cookie = {};
  if (cookies) {
    client_cookie = cookie.parse(cookies);
  }
  if (!req.cookies["user"]) return;
  let user = JSON.parse(req.cookies["user"]);

  let user_res = await (
    await set_data_in_database(`SELECT * FROM users WHERE username=?`, [
      user.username,
    ])
  )[0];

  if (!verifyToken(JSON.parse(client_cookie.user).key, user_res.user_key)) {
    res.cookie("user", "");
    res.status(406).json({
      message: "لطفا دوباره لاگین کنید.",
    });
    return;
  }

  if (user_res) {
    let members_ress;
    let start = 0;
    let plus = 100;
    if (req.body.start) start = req.body.start;
    if (type == "id") {
      members_ress = await set_data_in_database(`SELECT * FROM members`);
    } else if (!textSearch && type !== "lastYearGPA") {
      members_ress = await set_data_in_database(
        `SELECT firstName,lastName,fatherName ,birthDayDate,educationalBase,teacherName,nationalId,number,id,member_image_url FROM members LIMIT ${plus} OFFSET ?
      `,
        [start]
      );
    } else {
      members_ress = await set_data_in_database(
        `SELECT * FROM members LIMIT ${plus} OFFSET ?
      `,
        [start]
      );
    }
    let countOfAll = await set_data_in_database(
      `SELECT COUNT(*) FROM members`,
      []
    );
    if (!members_ress || !countOfAll) {
      res.status(406).json({ status: false });
      return;
    }
    countOfAll = countOfAll[0]["COUNT(*)"];
    let filteredArray = [];
    function searchHand() {
      let base = [
        "firstName",
        "lastName",
        "fatherName",
        "birthDayDate",
        "educationalBase",
        "teacherName",
        "nationalId",
        "number",
      ];
      if (type == "id") {
        members_ress.filter((item) => {
          let object = {};
          if (String(item[type]) == textSearch) {
            object[type] = item[type];
          } else return;
          base.forEach((bas) => {
            if (typeof decryptMessage(item[bas]) !== "string") {
              console.error(item[key], globalKeys);
              console.error(1);
            }
            item[bas] = String(decryptMessage(item[bas]));
            object[bas] = item[bas];
          });
          filteredArray.push(object);
        });
      } else if (!textSearch && type !== "lastYearGPA") {
        filteredArray.push(...members_ress);
        for (let index = 0; index < filteredArray.length; index++) {
          let item = filteredArray[index];
          let keys = Object.keys(item);
          for (let inde = 0; inde < keys.length; inde++) {
            const key = keys[inde];
            if (key !== "id" && item[key] !== null) {
              if (typeof decryptMessage(item[key]) !== "string") {
                console.error(item[key], globalKeys);
                console.error(globalKeys);
                console.error(2);
              }
              item[key] = decryptMessage(item[key]);
            }
          }
        }
      } else {
        switch (true) {
          case type === "birthDayDate":
            moment.loadPersian({
              dialect: "persian-modern",
            });
            for (let index = 0; index < members_ress.length; index++) {
              const item = members_ress[index];
              let object = {};
              item[type] = String(decryptMessage(item[type]));
              let now = moment(item[type], "jYYYY/jMM/jDD", "fa", true);

              let dayName = now
                .format("dddd")
                .replace(/\u200C/g, " ")
                .replace(" ", "");
              let month = now
                .format("jMMMM")
                .replace(/\u200C/g, " ")
                .replace(" ", "");

              if (
                String(dayName).includes(textSearch.replace(" ", "")) ||
                String(month).includes(textSearch.replace(" ", "")) ||
                Object.keys(faDate.days).find(
                  (key) =>
                    faDate.days[key] === textSearch && now.format("jD") === key
                )
              ) {
                object[type] = item[type];
              } else continue;
              base.forEach((bas) => {
                if (bas === type) return;
                item[bas] = String(decryptMessage(item[bas]));
                object[bas] = item[bas];
              });
              object["id"] = item["id"];
              filteredArray.push(object);
            }

            break;
          case type === "lastYearGPA":
            for (let index = 0; index < members_ress.length; index++) {
              const item = members_ress[index];
              let object = {};
              item[type] = String(decryptMessage(item[type]));
              if (textSearch)
                if (Math.floor(Number(textSearch)) === Math.floor(item[type])) {
                  object[type] = item[type];
                } else continue;
              else {
                object[type] = item[type];
              }
              base.forEach((bas) => {
                if (bas === type) return;
                item[bas] = String(decryptMessage(item[bas]));
                object[bas] = item[bas];
              });
              object["id"] = item["id"];
              filteredArray.push(object);
            }
            filteredArray.sort((a, b) => b[type] - a[type]);

            break;
          case type === "age":
            type = "birthDayDate";

            for (let index = 0; index < members_ress.length; index++) {
              const item = members_ress[index];
              let object = {};
              item[type] = String(decryptMessage(item[type]));
              if (textSearch) {
                let arrayOfText = textSearch.split(" ");
                let date = {};
                for (let index = 0; index < arrayOfText.length; index++) {
                  const item = arrayOfText[index];
                  if (item !== "و") {
                    if (Number(item) && !Number(arrayOfText[index + 1])) {
                      if (!date.hasOwnProperty(item))
                        date[arrayOfText[index + 1]] = item;
                    } else if (
                      !Number(item) &&
                      Number(arrayOfText[index + 1])
                    ) {
                      if (!date.hasOwnProperty(item))
                        date[item] = arrayOfText[index + 1];
                    }
                  }
                }
                const birthDate = moment(
                  item[type],
                  "jYYYY/jMM/jDD",
                  "fa",
                  true
                );
                const today = moment();

                const years = today.diff(birthDate, "years");
                birthDate.add(years, "years");

                const months = today.diff(birthDate, "months");
                birthDate.add(months, "months");
                let days = today.diff(birthDate, "days");
                item["age"] = `${years ? years + "سال  " : ""} ${
                  months ? (years ? " و " : "") + months + " ماه  " : ""
                } ${days > 0 ? (months ? " و " : "") + days + " روز" : ""} `;
                let member = {};
                if (item["age"].trim()) {
                  if (date["سال"]) {
                    if (years === Number(date["سال"])) member = item[type];
                  }
                  if (Number(date["ماه"])) {
                    if (months === Number(date["ماه"])) member = item[type];
                    else member = {};
                  }
                  if (Number(date["روز"])) {
                    if (days === Number(date["روز"])) member = item[type];
                    else member = {};
                  }
                  if (
                    !date["سال"] &&
                    !date["ماه"] &&
                    !date["روز"] &&
                    Number(textSearch)
                  ) {
                    Object.values(date).forEach((val) => {
                      if (
                        Number(val) === Number(years) ||
                        Number(val) === Number(months) ||
                        Number(val) === Number(days)
                      ) {
                        member = item[type];
                      }
                    });
                  }
                  object[type] = member;
                }
                if (Object.keys(member).length === 0) continue;
              } else {
                object[type] = item[type];
              }
              base.forEach((bas) => {
                if (bas === type) return;
                item[bas] = String(decryptMessage(item[bas]));
                object[bas] = item[bas];
              });
              object["id"] = item["id"];
              filteredArray.push(object);
            }
            filteredArray.sort((a, b) => b[type] - a[type]);

            break;
          case type !== "all":
            for (let index = 0; index < members_ress.length; index++) {
              const item = members_ress[index];
              let object = {};
              if (typeof decryptMessage(item[type]) !== "string") {
                console.error(item[key], globalKeys);
                console.error(1);
              }
              item[type] = String(decryptMessage(item[type]));
              if (String(item[type]).includes(textSearch)) {
                object[type] = item[type];
              } else continue;
              base.forEach((bas) => {
                if (bas === type) return;
                item[bas] = String(decryptMessage(item[bas]));
                object[bas] = item[bas];
              });

              object["id"] = item["id"];
              filteredArray.push(object);
            }

            break;
          default:
            members_ress.filter((item) => {
              let object = {};
              Object.keys(item).find((key) => {
                if (key !== "id" && item[key] !== null) {
                  if (typeof decryptMessage(item[key]) !== "string") {
                    console.error(item[key], globalKeys);
                    console.error(1);
                  }
                  item[key] = String(decryptMessage(item[key]));
                  if (String(item[key]).includes(textSearch)) {
                    object[key] = item[key];
                  }
                } else if (key === "id") {
                  if (item.id == textSearch) object[key] = item[key];
                }
              });
              if (Object.keys(object).length === 1 && object["id"]) {
                base.forEach((bas) => {
                  item[bas] = String(decryptMessage(item[bas]));
                  object[bas] = item[bas];
                });
                filteredArray.push(object);
              } else if (!object["id"] && Object.keys(object).length > 0) {
                base.forEach((bas) => {
                  if (bas === type) return;
                  object[bas] = item[bas];
                });
                object["id"] = item["id"];
                filteredArray.push(object);
              }
            });
            break;
        }
      }
    }
    searchHand();
    if (filteredArray.length < plus && textSearch && type !== "id") {
      while (countOfAll > start && filteredArray.length < plus) {
        start += plus;
        members_ress = await set_data_in_database(
          `SELECT * FROM members LIMIT ${plus} OFFSET ?
      `,
          [start]
        );
        await searchHand();
      }
      start += plus;
      // start = filteredArray.length;
      let hasStart = {};
      if (plus < start) hasStart = { start: start };
      res.status(200).json({ data: filteredArray, ...hasStart });
    } else {
      res.status(200).json({ data: filteredArray });
    }
  } else res.status(404).json({ message: `کاربر یافت نشد.`, status: false });
};
export default search;
