const mongoose=require("mongoose");
const initData=require("./data.js");
const Listing = require("../models/listing.js");
const dbUrl=process.env.ATLASDB_URL;
main()
  .then(()=>{
    console.log("connected to DB");
  })
  .catch((err)=>{
    console.log(err);
  });

async function main() {
    await mongoose.connect(dbUrl);
    console.log("connect");
   
}
const initDB= async ()=>{
    await Listing.deleteMany({});
    initData.data=initData.data.map((obj)=>({...obj,owner:"6889f8331d57bd6743971302"}));
    await Listing.insertMany(initData.data);
    console.log("Database initialized with sample data");
};

initDB();