import { encryptMessage, modifyUser, set_data_in_database, verifyToken } from "../core/utils.mjs";

const deleteFun = async (req, res) => {
  const { id } = req.body;
  let user_res;
  if (req.cookies.user) {
    let cookieUser = JSON.parse(req.cookies.user);
    user_res = await (
      await set_data_in_database(
        `SELECT * FROM users WHERE username=?`,
        cookieUser.username
      )
    )[0];
  }
  if (user_res)
    if (!verifyToken(JSON.parse(req.cookies.user).key, user_res.user_key)) {
      res.cookie("user", "");
      res.cookie("users", "");
      user_res = "";
    }
  let target_user = await (
    await set_data_in_database(`SELECT id FROM members WHERE id=?`, [id])
  )[0];
  if (!target_user) {
    return res.status(200).json({
      status: false,
      message: "کاربر یافت نشد.",
    });
  }
  let deleteMessage_res = await await set_data_in_database(
    `DELETE FROM members WHERE id=?`,
    [id]
  );
  user_res = await modifyUser(
    encryptMessage(req.body.nationalId),
    user_res.username,
    0
  );
  if (deleteMessage_res.affectedRows > 0 && user_res) {
    res.status(200).json({
      status: true,
    });
  } else {
    res.status(406).json({
      status: false,
      message: "کاربر حذف نشد.",
    });
  }
};
export default deleteFun;
