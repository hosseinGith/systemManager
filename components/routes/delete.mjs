import {
  checkUserAthu,
  decryptMessage,
  encryptMessage,
  modifyUser,
  sendEmailUserSubmited,
  set_data_in_database,
  verifyToken,
} from "../core/utils.mjs";

const deleteFun = async (req, res) => {
  const { id } = req.body;

  let { user_res, cookieUser } = await checkUserAthu(req, res);
  if (!user_res || !cookieUser) return;

  let member_res = await (
    await set_data_in_database(
      `SELECT id,firstName,lastName,nationalId FROM members WHERE id=?`,
      [id]
    )
  )[0];
  if (!member_res) {
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
    sendEmailUserSubmited(
      `کاربر ${
        decryptMessage(member_res.firstName) +
        " " +
        decryptMessage(member_res.lastName)
      }
      با ایدی ${decryptMessage(member_res.nationalId)}
      توسط ${user_res.username}
      حذف شد
      `
    );
  } else {
    res.status(406).json({
      status: false,
      message: "کاربر حذف نشد.",
    });
  }
};
export default deleteFun;
