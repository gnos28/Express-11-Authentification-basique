const moviesRouter = require("express").Router();
const Movie = require("../models/movie");
const User = require("../models/user");

moviesRouter.get("/", (req, res) => {
  const { max_duration, color } = req.query;
  const cookies = req.cookies;
  const token = cookies.user_token;

  User.findIdByToken(token).then((user_id) => {
    if (user_id) {
      Movie.findMany({ filters: { max_duration, color, user_id } })
        .then((movies) => {
          res.json(movies);
        })
        .catch((err) => {
          console.log(err);
          res.status(500).send("Error retrieving movies from database");
        });
    } else res.status(401).send("user not logged in");
  });
});

moviesRouter.get("/:id", (req, res) => {
  Movie.findOne(req.params.id)
    .then((movie) => {
      if (movie) {
        res.json(movie);
      } else {
        res.status(404).send("Movie not found");
      }
    })
    .catch((err) => {
      res.status(500).send("Error retrieving movie from database");
    });
});

moviesRouter.post("/", (req, res) => {
  const error = Movie.validate(req.body);
  const cookies = req.cookies;
  const token = cookies.user_token;

  if (error) {
    res.status(422).json({ validationErrors: error.details });
  } else {
    User.findIdByToken(token).then((userId) => {
      console.log("userId", userId, typeof userId);

      if (userId) {
        Movie.create({ ...req.body, user_id: userId.id })
          .then((createdMovie) => {
            res.status(201).json(createdMovie);
          })
          .catch((err) => {
            console.error(err);
            res.status(500).send("Error saving the movie");
          });
      } else res.status(401).send("user not logged in");
    });
  }
});

moviesRouter.put("/:id", (req, res) => {
  let existingMovie = null;
  let validationErrors = null;
  Movie.findOne(req.params.id)
    .then((movie) => {
      existingMovie = movie;
      if (!existingMovie) return Promise.reject("RECORD_NOT_FOUND");
      validationErrors = Movie.validate(req.body, false);
      if (validationErrors) return Promise.reject("INVALID_DATA");
      return Movie.update(req.params.id, req.body);
    })
    .then(() => {
      res.status(200).json({ ...existingMovie, ...req.body });
    })
    .catch((err) => {
      console.error(err);
      if (err === "RECORD_NOT_FOUND")
        res.status(404).send(`Movie with id ${req.params.id} not found.`);
      else if (err === "INVALID_DATA")
        res.status(422).json({ validationErrors: validationErrors.details });
      else res.status(500).send("Error updating a movie.");
    });
});

moviesRouter.delete("/:id", (req, res) => {
  Movie.destroy(req.params.id)
    .then((deleted) => {
      if (deleted) res.status(200).send("???? Movie deleted!");
      else res.status(404).send("Movie not found");
    })
    .catch((err) => {
      console.log(err);
      res.status(500).send("Error deleting a movie");
    });
});

module.exports = moviesRouter;
