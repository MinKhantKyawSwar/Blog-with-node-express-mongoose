const { formatISO9075 } = require("date-fns");
const Post = require("../models/post");

const POST_PER_PAGE = 6;

exports.getProfile = (req, res, next) => {
  const pageNumber = +req.query.page || 1;
  let totalPostNumber;

  Post.find({ userId: req.user._id })
    .countDocuments()
    .then((totalPostCount) => {
      totalPostNumber = totalPostCount;
      return Post.find()
        .populate("userId", "email")
        .skip((pageNumber - 1) * POST_PER_PAGE)
        .limit(POST_PER_PAGE)
        .sort({ createdAt: -1 });
    })

    .then((posts) => {
      if (posts.length > 0) {
        res.render("user/profile", {
          title: req.session.userInfo.email,
          postsArr: posts,
          currentPage: pageNumber,
          hasNextPage: POST_PER_PAGE * pageNumber < totalPostNumber,
          hasPreviousPage: pageNumber > 1,
          nextPage: pageNumber + 1,
          previousPage: pageNumber - 1,
          currentUserEmail: req.session.userInfo
            ? req.session.userInfo.email
            : "",
        });
      } else {
        res.status(500).render("error/500", {
          title: "Something went wrong.",
          message: "No post in this page query.",
        });
      }
    })
    .catch((err) => {
      console.log(err);
      const error = new Error("Something went wrong.");
      return next(error);
    });
};
