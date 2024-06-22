const express = require("express");

const router = express.Router();
const postController = require("../controllers/post");
const { body } = require("express-validator");

// /admin/create-post
router.get("/create-post", postController.renderCreatePage);

router.post(
  "/",
  [
    body("title")
      .isLength({ min: 10 })
      .withMessage("Title must have at least 10 letters."),
    body("photo").isURL().withMessage("Image URL must be a valid URL."),
    body("description")
      .isLength({ min: 30 })
      .withMessage("Description must have at least 30 letters."),
  ],
  postController.createPost
);

//edit
router.get("/edit/:postId", postController.getEditPost);

router.post(
  "/edit-post",
  [
    body("title")
      .isLength({ min: 10 })
      .withMessage("Title must have at least 10 letters."),
    body("photo").isURL().withMessage("Image URL must be a valid URL."),
    body("description")
      .isLength({ min: 30 })
      .withMessage("Description must have at least 30 letters."),
  ],
  postController.updatePost
);

//delete
router.post("/delete/:postId", postController.deletePost);

module.exports = router;
