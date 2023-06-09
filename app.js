

const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const databasePath = path.join(__dirname, "twitterClone.db");

const app = express();

app.use(express.json());

let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });

    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const authenticateToken = (request, response, next) => {
  let jwtToken;
  const authHeader = request.headers["authorization"];
  if (authHeader !== undefined) {
    jwtToken = authHeader.split(" ")[1];
  }
  if (jwtToken === undefined) {
    response.status(401);
    response.send("Invalid JWT Token");
  } else {
    jwt.verify(jwtToken, "MY_SECRET_TOKEN", async (error, payload) => {
      if (error) {
        response.status(401);
        response.send("Invalid JWT Token");
      } else {
          request.username=payload.username
        next();
      }
    });
  }
};


app.post("/register/", async (request, response) => {
  const { username, password ,name,gender} = request.body;
  const selectUserQuery = `SELECT * FROM user WHERE username = '${username}'`;
  const dbUser = await db.get(selectUserQuery);
  console.log(dbUser)
  if (dbUser !== undefined) {
    response.status(400);
    response.send("User already exists");
 }
  else{
      if (password.length>=6){
          const hashPwd= await bcrypt.hash(password,10)
const w=`insert into user(username,password,name,gender)
values ("${username}","${hashPwd}","${name}","${gender}");`
await db.run(w)
response.send("User created successfully")     
      }
      else{
          response.status(400)
          response.send("Password is too short")
          
      }
  }
});






app.post("/login/", async (request, response) => {
  const { username, password } = request.body;
  const selectUserQuery = `SELECT * FROM user WHERE username = '${username}'`;
  const dbUser = await db.get(selectUserQuery);
  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isPasswordMatched = await bcrypt.compare(password, dbUser.password);
    if (isPasswordMatched === true) {
      const payload = {
        username: username,
      };
      const jwtToken = jwt.sign(payload, "MY_SECRET_TOKEN");
      response.send({ jwtToken });
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});


app.get("/user/tweets/feed/",authenticateToken,async(request,response)=>{
    const {username}=request
    const i=`select * from user where username ="${username}";`
const getUserId =await db.get(i)  
    const r =`select username,tweet,date_time as dateTime  from (user natural join follower) as t natural join tweet  where following_user_id="${getUserId.user_id}" order by tweet_id desc limit 4 offset 0;`;
    const e =await db.all(r)
    console.log(e)
    response.send(e)
    

})


module.exports=app












