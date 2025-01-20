import mongoose from "mongoose";

function connect() {
  mongoose
    .connect(process.env.MONGO_URI || "mongodb://localhost:27017/mychatai")
    .then(() => {
      console.log("Connected to DB");
    })
    .catch((err) => {
      console.log(err);
    });
}

export default connect;
