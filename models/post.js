const mongodb = require("mongodb");
const { getDatabase } = require("../utils/database");

class Post {
  constructor(title, description, imgUrl, id) {
    this.title = title;
    this.description = description;
    this.imgUrl = imgUrl;
    this._id = id ? new mongodb.ObjectId(id) : null;
  }

  create() {
    const db = getDatabase();
    let dbTmp;

    if (this._id) {
      // update post
      dbTmp = db
        .collection("post")
        .updateOne({ _id: this._id }, { $set: this });
    } else {
      //create post
      dbTmp = db.collection("post").insertOne(this);
    }
    return dbTmp
      .then((result) => console.log(result))
      .catch((err) => console.log(err));
  }

  static getPosts() {
    const db = getDatabase();
    return db
      .collection("post", { locale: "en", caseLevel: true })
      .find()
      .sort({ title: 1 })
      .toArray()
      .then((posts) => {
        console.log(posts);
        return posts;
      })
      .catch((err) => console.log(err));
  }

  static getPost(postId) {
    const db = getDatabase();
    return db
      .collection("post")
      .find({ _id: new mongodb.ObjectId(postId) })
      .next()
      .then((post) => {
        console.log(post);
        return post;
      })
      .catch((err) => console.log(err));
  }

  static deleteById(postId) {
    const db = getDatabase();
    return db
      .collection("post")
      .deleteOne({ _id: new mongodb.ObjectId(postId) })
      .then((result) => console.log("post deleted"))
      .catch((err) => console.log(err));
  }
}

module.exports = Post;
