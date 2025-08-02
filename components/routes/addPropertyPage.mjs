import { fs } from "../core/settings.mjs";
import {
  checkUserAthu,
  errorHand,
  set_data_in_database,
  verifyToken,
} from "../core/utils.mjs";

const addPropertyPage = async (req, res, next) => {
  try {
    let { user_res, cookieUser } = await checkUserAthu(req, res);
    if (!user_res || !cookieUser) return;

    let path = !user_res ? "pages/login.html" : "pages/add-property.html";
    let data = fs.readFileSync(path, "utf8");
    data = data.replace(/\?\=\d+\"/g, "?=" + Math.random() + '"');

    res.send(data);
  } catch (err) {
    errorHand(err);

    next();
    res.status(500).send("Server Error");
  }
};
export default addPropertyPage;
