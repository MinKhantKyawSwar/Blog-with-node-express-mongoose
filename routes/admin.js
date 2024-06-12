const express = require("express");

const router = express.Router();
const postController = require("../controllers/post");

// /admin/create-post
router.get("/create-post", postController.renderCreatePage);

router.post("/", postController.createPost);

//edit
router.get("/edit/:postId", postController.getEditPost);

router.post("/edit-post", postController.updatePost);

//delete
router.post("/delete/:postId", postController.deletePost);

module.exports = router;
