import {
  decryptMessage,
  encryptMessage,
  errorHand,
  set_data_in_database,
  verifyToken,
} from "../core/utils.mjs";

const addUserBookScore = async (req, res) => {
  const { id } = req.params;
  const datas = req.body;
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
      await set_data_in_database(
        `SELECT id,nationalId FROM members WHERE id=?`,
        [id]
      )
    )[0];
    if (!member_res)
      return res.status(404).json({
        status: false,
        message: "کاربر مورد نظر در سیستم وجود ندارد.",
      });
    if (datas.scoreType !== "mostamarClass") {
      let check_score = await (
        await set_data_in_database(
          `SELECT id FROM 
            educationalbasescores
           WHERE 
            memberNationalId= BINARY ? AND
            bookName= BINARY ? AND
            educationalBase = BINARY ? AND
            reshte= BINARY ? AND
            scoreType= BINARY ?  
           `,
          [
            decryptMessage(member_res.nationalId),
            datas.bookName,
            datas.educationalBaseAddScore,
            datas.reshteSelect,
            datas.scoreType,
          ]
        )
      )[0];
      if (check_score?.id) {
        await set_data_in_database(
          "UPDATE `educationalbasescores` SET `score`=?, `date`=? WHERE id=?",
          [datas.scoreInput, datas.dateBookQuestion, check_score.id]
        );
        res.status(200).json({
          status: true,
          message: "نمره ویرایش شد.",
        });
        return;
      }
    }
    await set_data_in_database(
      "INSERT INTO `educationalbasescores` (`memberNationalId`, `bookName`, `educationalBase`, `score`, `date`,`reshte`,`scoreType`) VALUES(?,?,?,?,?,?,?)",
      [
        decryptMessage(member_res.nationalId),
        datas.bookName,
        datas.educationalBaseAddScore,
        datas.scoreInput,
        datas.dateBookQuestion,
        datas.reshteSelect,
        datas.scoreType,
      ]
    );

    res.status(200).json({
      status: true,
      message: "نمره اضافه شد.",
    });
  } catch (err) {
    errorHand(err);

    res.status(500).send("Server Error");
  }
};
export default addUserBookScore;
