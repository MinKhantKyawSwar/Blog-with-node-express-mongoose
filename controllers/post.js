const Post = require("../models/post");
const { validationResult } = require("express-validator");
const { formatISO9075 } = require("date-fns");
const pdf = require("pdf-creator-node");

const fs = require("fs");
const exPath = require("path");

const fileDelete = require("../utils/fileDelete");

const POST_PER_PAGE = 6;

exports.createPost = (req, res, next) => {
  const { title, description } = req.body;
  const image = req.file;
  const errors = validationResult(req);

  if (image === undefined) {
    return res.status(422).render("addPost", {
      title: "Post create",
      errorMsg: "Image extension must be jpg,png and jpeg.",
      oldFormData: { title, description },
    });
  }

  if (!errors.isEmpty()) {
    return res.status(422).render("addPost", {
      title: "Create Post",
      errorMsg: errors.array()[0].msg,
      oldFormData: {
        title,
        description,
      },
    });
  }

  Post.create({
    title,
    description,
    imgUrl: image.path,
    userId: req.user,
  })
    .then((result) => {
      res.redirect("/");
    })
    .catch((err) => {
      console.log(err);
      const error = new Error("Something went wrong when creating your blog.");
      return next(error);
    });
};

exports.renderCreatePage = (req, res, next) => {
  res.render("addPost", {
    title: "Post create ml",
    oldFormData: {
      title: "",
      description: "",
      photo: "",
    },
    errorMsg: "",
  });
};

exports.renderHomePage = (req, res, next) => {
  const pageNumber = +req.query.page || 1;
  let totalPostNumber;
  // total => 6 , 12
  // per page => 3
  // next page => -3 + 3

  //page 1 => 1 - 1 = 1
  //post per page => 3 * 0 = 0 <- skip post

  //page 2 => 2 - 1 = 1
  //post per page => 3 * 1 = 3  <- skip post

  //total post => **6 posts

  //page 3 => 3 - 1 = 2
  //post per page => 3 * 2 = **6 <- skip post

  //total post => **9 posts

  //page 4 => 4 - 1 = 3
  //post per page => 3 * 3 = **9 <- skip post
  Post.find()
    .countDocuments()
    .then((totalPostCount) => {
      totalPostNumber = totalPostCount;
      return Post.find()
        .select("title description imgUrl")
        .populate("userId", "email")
        .skip((pageNumber - 1) * POST_PER_PAGE)
        .limit(POST_PER_PAGE)
        .sort({ createdAt: -1 });
    })

    .then((posts) => {
      if (posts.length > 0) {
        res.render("home", {
          title: "Homepage",
          postsArr: posts,
          // currentUserEmail: req.session.userInfo
          //   ? req.session.userInfo.email
          //   : "",
          currentPage: pageNumber,
          hasNextPage: POST_PER_PAGE * pageNumber < totalPostNumber,
          hasPreviousPage: pageNumber > 1,
          nextPage: pageNumber + 1,
          previousPage: pageNumber - 1,
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

exports.getPost = (req, res, next) => {
  const postId = req.params.postId;
  Post.findById(postId)
    .populate("userId", "email")
    .then((post) => {
      res.render("details", {
        title: post.title,
        post,
        date: post.createdAt
          ? formatISO9075(post.createdAt, { representation: "date" })
          : "",
        currentLoginUserId: req.session.userInfo
          ? req.session.userInfo._id
          : "",
      });
    })
    .catch((err) => {
      console.log(err);
      const error = new Error("Post not Found with this id.");
      return next(error);
    });
};

exports.getEditPost = (req, res, next) => {
  const postId = req.params.postId;
  Post.findById(postId)
    .then((post) => {
      if (!post) {
        return res.redirect("/");
      }
      res.render("editPost", {
        postId,
        title: post.title,
        post,
        errorMsg: "",
        oldFormData: {
          title: undefined,
          description: undefined,
        },
        isValidationFail: false,
      });
    })
    .catch((err) => {
      console.log(err);
      const error = new Error("Something went wrong");
      return next(error);
    });
};

exports.updatePost = (req, res, next) => {
  const { postId, title, description } = req.body;
  const image = req.file;
  const errors = validationResult(req);

  if (image === undefined) {
    return res.status(422).render("editPost", {
      postId,
      title,
      isValidationFail: true,
      errorMsg: "Image extension must be jpg,png and jpeg.",
      oldFormData: { title, description },
    });
  }

  if (!errors.isEmpty()) {
    return res.status(422).render("editPost", {
      postId,
      title,
      errorMsg: errors.array()[0].msg,
      oldFormData: {
        title,
        description,
      },
      isValidationFail: true,
    });
  }

  Post.findById(postId)
    .then((post) => {
      if (post.userId.toString() !== req.user._id.toString()) {
        return res.redirect("/");
      }
      post.title = title;
      post.description = description;
      if (image) {
        fileDelete(post.imgUrl);
        post.imgUrl = image.path;
      }
      return post.save().then(() => {
        console.log("Post Updated");
        res.redirect("/");
      });
    })
    .catch((err) => {
      console.log(err);
      const error = new Error("Something went wrong");
      return next(error);
    });
};

exports.deletePost = (req, res, next) => {
  const { postId } = req.params;
  Post.findById(postId)
    .then((post) => {
      if (!post) {
        return res.redirect("/");
      }
      fileDelete(post.imgUrl);
      return Post.deleteOne({ _id: postId, userId: req.user._id });
    })
    .then(() => {
      console.log("post deleted");
      res.redirect("/");
    })
    .catch((err) => {
      console.log(err);
      const error = new Error("Something went wrong");
      return next(error);
    });
};

exports.savePostAsPDF = (req, res, next) => {
  const { id } = req.params;
  const templateUrl = `${exPath.join(
    __dirname,
    "../views/template/template.html"
  )}`;
  const html = fs.readFileSync(templateUrl, "utf8");

  const options = {
    format: "A3",
    orientation: "portrait",
    border: "10mm",
    header: {
      height: "20mm",
      contents:
        '<div style="text-align: center;">Delivered from MinKhantDev</div>',
    },
    footer: {
      height: "15mm",
      contents: {
        default:
          '<p style="color: #444;text-align: center">@minkhantblog.mm</p>', // fallback value
      },
    },
  };

  Post.findById(id)
    .populate("userId", "email")
    .lean()
    .then((post) => {
      const date = new Date();
      const pdfSaveUrl = `${exPath.join(
        __dirname,
        "../public/pdf",
        date.getTime() + ".pdf"
      )}`; // controllers/post.js -> public/pdf/12:12.pdf
      const document = {
        html,
        data: {
          post,
        },
        path: pdfSaveUrl,
        type: "",
      };
      console.log(post);
      pdf
        .create(document, options)
        .then((result) => {
          // console.log(result);
          res.download(pdfSaveUrl, (err) => {
            if (err) throw err;
            fileDelete(pdfSaveUrl);
          });
        })
        .catch((error) => {
          console.error(error);
        });
    })
    .catch((err) => {
      console.log(err);
      const error = new Error("Something went wrong");
      return next(error);
    });
};
