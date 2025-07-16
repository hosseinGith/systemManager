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
    let add_res = await set_data_in_database(
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
    if (!add_res)
      return res.status(404).json({
        status: false,
        message: "مشکل در سیستم.",
      });
    res.status(200).json({
      status: true,
    });
  } catch (err) {
    errorHand(err);

    res.status(500).send("Server Error");
  }
};
export default addUserBookScore;
