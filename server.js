const express = require("express");
const mysql = require("mysql2");
const dotenv = require("dotenv");
const bodyParser = require("body-parser");
const cors = require("cors");
const { swaggerSpec, swaggerUi } = require("./swagger");
const fs = require("fs");

const app = express();
dotenv.config();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  port: process.env.DB_PORT,
  ssl: {
    ca: fs.readFileSync(process.env.DB_SSL_CA_PATH),
  },
});

db.connect((err) => {
  if (err) {
    throw err;
  }
  console.log("Connected to database");
});

/**
 * @swagger
 * /:
 *   get:
 *     summary: Retrieve a list of videos.
 *     responses:
 *       '200':
 *         description: A JSON array of videos.
 */

app.get("/", (req, res) => {
  const query = `
    SELECT vl.video_id, vl.title, vl.video_url, vl.thumbnail_url, vl.created_at,
            c.channel_id, c.name, c.profile_picture_url, 
            p.view_count
    FROM videos vl
    JOIN channels c ON vl.channel_id = c.channel_id
    JOIN popular p ON vl.video_id = p.video_id
    `;

  db.query(query, (err, result) => {
    if (err) {
      console.error("เกิดข้อผิดพลาดในการดึงข้อมูล:", err);
      res.status(500).send("เกิดข้อผิดพลาดในการดึงข้อมูล");
    } else {
      res.json(result);
    }
  });
});

app.get("/short", (req, res) => {
  const query = `
  SELECT vl.video_title, vl.video_thumbnail
  FROM videos_short vl
  JOIN channels c ON vl.channel_id = c.channel_id
  JOIN popular p ON vl.video_id = p.video_id
  `;

  db.query(query, (err, result) => {
    if (err) {
      console.error("เกิดข้อผิดพลาดในการดึงข้อมูล:", err);
      res.status(500).send("เกิดข้อผิดพลาดในการดึงข้อมูล");
    } else {
      res.json(result);
    }
  });
});

/**
 * @swagger
 * /subscribe:
 *   get:
 *     summary: Retrieve a list of subscribed channels for a user.
 *     parameters:
 *       - in: query
 *         name: user_id
 *         required: true
 *         description: The ID of the user.
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: A JSON array of subscribed channels.
 */

app.get("/subscribe", (req, res) => {
  const user_id = req.query.user_id;
  if (!user_id) {
    res.status(400).send("กรุณาระบุ user_id");
    return;
  }

  const query = `
    SELECT u.user_id, u.user_name, u.user_profile_picture,
            c.channel_id, c.channel_name, c.channel_profile_picture
    FROM users u
    JOIN channel_subscribe cs ON u.user_id = cs.user_id
    JOIN channels c ON cs.channel_id = c.channel_id
    WHERE u.user_id = ?
    `;

  const values = [user_id];

  db.query(query, values, (err, result) => {
    if (err) {
      console.error("เกิดข้อผิดพลาดในการดึงข้อมูล:", err);
      res.status(500).send("เกิดข้อผิดพลาดในการดึงข้อมูล");
    } else {
      res.json(result);
    }
  });
});

/**
 * @swagger
 * /result:
 *   get:
 *     summary: Search for videos based on a query.
 *     parameters:
 *       - name: search_query
 *         in: query
 *         required: true
 *         description: The search query.
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: A JSON array of videos.
 */

app.get("/result", (req, res) => {
  const { search_query } = req.query;

  const query = `
      SELECT vl.video_id, vl.video_title, vl.video_created_at, vl.video_thumbnail,
             c.channel_name, c.channel_profile_picture,
             p.view_count
      FROM videos vl
      JOIN channels c ON vl.channel_id = c.channel_id
      JOIN popular p ON vl.video_id = p.video_id
      WHERE vl.video_title LIKE ? OR c.channel_name LIKE ?;
    `;

  db.query(query, [`%${search_query}%`, `%${search_query}%`], (err, result) => {
    if (err) {
      console.error("เกิดข้อผิดพลาดในการค้นหา:", err);
      res.status(500).send("เกิดข้อผิดพลาดในการค้นหา");
    } else {
      res.json(result);
    }
  });
});

/**
 * @swagger
 * /watch:
 *   get:
 *     summary: Retrieve details of a specific video.
 *     parameters:
 *       - name: v
 *         in: query
 *         required: true
 *         description: The video ID.
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: A JSON array containing details of the video.
 */
app.get("/watch", (req, res) => {
  console.log(req.query);
  const { v } = req.query;
  if (!v) {
    res.status(400).send("Invalid video parameter");
    return;
  }

  const query = `
      SELECT
        vl.video_id,
        vl.video_title,
        vl.video_description,
        vl.video_duration,
        vl.video_thumbnail,
        vl.video_url,
        vl.video_created_at,
        c.channel_name,
        c.channel_profile_picture,
        p.view_count,
        p.like_count,
        (SELECT COUNT(*) FROM channel_subscribe WHERE channel_id = vl.channel_id AND user_id = ?) AS is_subscribed,
        (
          SELECT GROUP_CONCAT(CONCAT(u.user_name, ': ', cm.comment_text) ORDER BY cm.comment_created_at SEPARATOR '\n')
          FROM comments cm
          JOIN users u ON cm.user_id = u.user_id
          WHERE cm.video_id = vl.video_id
        ) AS comments
        
      FROM videos vl
      JOIN channels c ON vl.channel_id = c.channel_id
      JOIN popular p ON vl.video_id = p.video_id
      WHERE vl.video_id = ?;
    `;

  db.query(query, [v, v], (err, result) => {
    if (err) {
      console.error("เกิดข้อผิดพลาดในการค้นหา:", err);
      res.status(500).send("เกิดข้อผิดพลาดในการค้นหา");
    } else {
      const video = result[0];
      const comments = video.comments.split("\n").map((comment) => {
        const [username, content] = comment.split(": ");
        return { [username]: { content } };
      });
      video.comments = comments;
      res.json([video]);
    }
  });
});

app.post("/register", async (req, res) => {
  const { username, email, password } = await req.body;

  // // Check if all required fields are provided
  // if (!username || !email || !password) {
  //   return res.status(400).json({ message: "กรุณาระบุชื่อผู้ใช้, อีเมล, และรหัสผ่าน" });
  // }

  // Insert the user into the database
  const query =
    "INSERT INTO users (username, email, password) VALUES (?, ?, ?)";
  const values = [username, email, password];

  db.query(query, values, (err, result) => {
    if (err) {
      console.error("เกิดข้อผิดพลาดในการลงทะเบียน:", err);
      return res.status(500).json({ message: "เกิดข้อผิดพลาดในการลงทะเบียน" });
    }
    console.log("User registered successfully");
    res.status(200).json({ message: "ลงทะเบียนสำเร็จ" });
  });
});

app.get("/users", (req, res) => {
  const query = "SELECT * FROM users";
  db.query(query, (err, result) => {
    if (err) {
      console.error("เกิดข้อผิดพลาดในการดึงข้อมูล:", err);
      res.status(500).send("เกิดข้อผิดพลาดในการดึงข้อมูล");
    } else {
      res.json(result);
    }
  });
});

app.listen(process.env.PORT, () => {
  console.log("Example app listening on port " + process.env.PORT);
});
