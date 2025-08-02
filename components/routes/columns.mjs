import {
  checkUserAthu,
  errorHand,
  set_data_in_database,
  verifyToken,
} from "../core/utils.mjs";

const columns = async (req, res, next) => {
  try {
    let { user_res, cookieUser } = await checkUserAthu(req, res);
    if (!user_res || !cookieUser) return;

    let columns_res = await await set_data_in_database(`SELECT * FROM columns`);
    if (columns_res) {
      res.status(200).json({
        status: true,
        columns: columns_res,
      });
    } else {
      res.status(500).json({
        status: false,
      });
    }
  } catch (err) {
    errorHand(err);

    next();
    res.status(500).send("Server Error");
  }
};
export default columns;
