// models/user.js
class User {
  constructor(userid, username) {
    this.userid = userid;
    this.username = username;
    this.stage = "bigbang";       // 초기 단계
    this.status = "paused";       // started / paused
  }
}

module.exports = User;