import httpStatus from "http-status";
import { User } from "../models/user.model.js";
import bcrypt, { hash } from "bcrypt";
import crypto from "crypto";
import { Metting } from "../models/metting.model.js";

const login = async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: "Please Provide" });
  }
  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res
        .status(httpStatus.NOT_FOUND)
        .json({ message: "User Not Found" });
    }

    let isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (isPasswordCorrect) {
      let token = crypto.randomBytes(20).toString("hex");
      user.token = token;
      await user.save();
      res
        .status(httpStatus.OK)
        .json({ message: "User Logged In", token: token });
    }
    else
    {
      return res
        .status(httpStatus.UNAUTHORIZED)
        .json({ message: "Invalid Username or Password" });
    }
  } catch (e) {
    return res.status(500).json({ message: `Something went wrong ${e}` });
  }
};

const register = async (req, res) => {
  const { name, username, password } = req.body;
  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res
        .status(httpStatus.FOUND)
        .json({ message: "User already exists" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      name: name,
      username: username,
      password: hashedPassword,
    });
    await newUser.save();
    res.status(httpStatus.CREATED).json({ message: "User Registered" });
  } catch (e) {
    res.json({ message: `Something went wrong ${e}` });
  }
};

const getUserHistory = async (req, res) => {
  const { token } = req.query;
  try{
    const user = await User.findOne({token:token});
    const meetings = await Metting.find({user_id:user.username});
    res.json(meetings);
  } catch (e){
    res.json({ message: `Something went wrong ${e}` });
  }
};
const addToHistory = async (req, res) => {
  const {token , meeting_code} = req.body;
  try{
    const user = await User.findOne({token:token});
    const newMetting = new Metting({user_id:user.username , mettingCode:meeting_code});
    await newMetting.save();
    res.status(httpStatus.CREATED).json({ message: "Added code to history" });
  } catch(e){
    res.json({ message: `Something went wrong ${e}` });
  }
}
export {login , register, getUserHistory , addToHistory};
