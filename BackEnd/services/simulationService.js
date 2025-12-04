// services/simulationService.js
const User = require("../models/user");

class SimulationService {
  constructor() {
    this.users = {};      // 메모리 기반 저장
    this.nextUserId = 1;
    this.stageOrder = ["bigbang", "galaxy_formation", "solar_system"];
  }

  createUser(username) {
    const userid = this.nextUserId++;
    const user = new User(userid, username);
    this.users[userid] = user;
    return user;
  }

  getUser(userid) {
    return this.users[userid];
  }

  startSimulation(userid) {
    const user = this.getUser(userid);
    if (!user) return null;
    user.status = "started";
    user.stage = "bigbang";
    return user;
  }

  pauseSimulation(userid) {
    const user = this.getUser(userid);
    if (!user) return null;
    user.status = "paused";
    return user;
  }

  nextStage(userid) {
    const user = this.getUser(userid);
    if (!user) return null;
    const index = this.stageOrder.indexOf(user.stage);
    if (index < this.stageOrder.length - 1) {
      user.stage = this.stageOrder[index + 1];
    }
    return user;
  }

  prevStage(userid) {
    const user = this.getUser(userid);
    if (!user) return null;
    const index = this.stageOrder.indexOf(user.stage);
    if (index > 0) {
      user.stage = this.stageOrder[index - 1];
    }
    return user;
  }

  changeStage(userid, stage) {
    const user = this.getUser(userid);
    if (!user) return null;
    if (this.stageOrder.includes(stage)) user.stage = stage;
    return user;
  }

  getStage(userid) {
    const user = this.getUser(userid);
    return user ? user.stage : null;
  }

  getUsers() {
    return Object.values(this.users);
  }
}

module.exports = new SimulationService();