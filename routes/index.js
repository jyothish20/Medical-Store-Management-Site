var express = require('express');
var router = express.Router();
const Client = require('../models/clientModel');
const { validationResult } = require('express-validator');
const {validateEmail,validatePassword} = require('./customValidators')
const bcrypt = require('bcrypt');
const session = require('express-session');
const saltRounds = 10;
const Medicine = require('../models/medicineModel');

router.get('/', function(req, res) {

  res.render("signup", { errors: [] });

});
router.post('/createUser', [
  // Add custom validation for email and password
  validateEmail,
  validatePassword
], function (req, res) {
  const errors = req.validationErrors || [];
  const validationResultErrors = validationResult(req);
  
  if (!validationResultErrors.isEmpty()) {
    errors.push(...validationResultErrors.array());
  }

  if (errors.length > 0) {
    return res.render('signup', { errors, email: req.body.email });
  }

  const { username, email, password } = req.body;

  // Hash the password before saving it to the database
  bcrypt.hash(password, saltRounds, (err, hashedPassword) => {
    if (err) {
      console.error(err);
      return res.render('signup', { errors: ['Failed to hash password'] });
    }

    const newClient = new Client({
      username,
      email,
      password: hashedPassword, // Store hashed password
    });

    newClient.save()
      .then(() => res.render('login')) // Redirect to login page
      .catch((error) => {
        console.error(error);
        res.render('signup', { errors: ['Failed to save user'] });
      });
  });
});
  // Dashboard Route
  router.get('/dashboard', async (req, res) => {
    if (!req.session.userId) {
      return res.redirect('/login'); // Redirect to login if not logged in
    }
  
    try {
      const user = await Client.findById(req.session.userId);
      if (!user) {
        return res.redirect('/login'); // Redirect if user not found
      }
      res.render('dashboard', { user, error: null }); // Pass error as null by default
    } catch (err) {
      console.error(err);
      return res.redirect('/login'); // Redirect on error
    }
  });
  
// Login Route
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  
  // Find the user by email
  const user = await Client.findOne({ email });
  if (!user) {
    return res.render('login', { error: 'Invalid email or password' });
  }

  // Compare the entered password with the hashed password
  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    return res.render('login', { error: 'Invalid email or password' });
  }

  // Set session and redirect to dashboard
  req.session.userId = user._id;
  res.redirect('/dashboard');
});
router.get('/login', (req, res) => {
  res.render('login');
});

// Logout Route
router.get('/logout', (req, res) => {
  console.log("Logout route hit");
  req.session.destroy((err) => {
    if (err) {
      console.error(err);
      res.send('Error');
    } else {
      res.redirect('/login');
    }
  });
});
// Define the isAuthenticated middleware
const isAuthenticated = (req, res, next) => {
  // Check if the user is authenticated
  if (req.session && req.session.userId) {
    // User is authenticated, proceed to the next middleware
    return next();
  }

  // User is not authenticated, redirect to the login page
  res.redirect('/login');
};

// Add Medicine
router.post('/addMedicine', isAuthenticated,async (req, res) => {
  const { medicineName, stock } = req.body;

  try {
    const userId = req.session.userId;
    const existingMedicines = await Medicine.find({ addedBy: userId });

    if (existingMedicines.length >= 5) {
      const user = await Client.findById(userId);
      return res.render('dashboard', { 
        user, 
        error: 'You can only add up to 5 medicines.' 
      });
    }

    const newMedicine = new Medicine({
      name: medicineName,
      stock: Number(stock),
      addedBy: userId
    });

    await newMedicine.save();
    res.redirect('/medicines');
  } catch (err) {
    console.error(err);
    res.redirect('/dashboard');
  }
});


// Medicines Listing with Pagination
router.get('/medicines',isAuthenticated, async (req, res) => {
  const userId = req.session.userId;
  const page = parseInt(req.query.page) || 1;
  const limit = 3;

  try {
    const medicines = await Medicine.find({ addedBy: userId })
      .sort({ addedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const count = await Medicine.countDocuments({ addedBy: userId });

    res.render('medicines', { medicines, currentPage: page, totalPages: Math.ceil(count / limit) });
  } catch (err) {
    console.error(err);
    res.redirect('/dashboard');
  }
});

// Search Medicines using Ajax
router.get('/searchMedicines', async (req, res) => {
  const { query } = req.query;
  const userId = req.session.userId;

  try {
    const medicines = await Medicine.find({
      addedBy: userId,
      name: { $regex: query, $options: 'i' }
    });
    res.json(medicines);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error searching medicines');
  }
});
// Edit Medicine Route
router.get('/editMedicine/:id',async (req, res) => {
  try {
    const medicine = await Medicine.findById(req.params.id);
    if (!medicine) {
      return res.status(404).send('Medicine not found');
    }

    // Render the edit form, passing the medicine details
    res.render('editMedicine', { medicine });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error fetching medicine');
  }
});
// Update Medicine Route (POST)
router.post('/updateMedicine/:id',async (req, res) => {
  const { medicineName, stock } = req.body;

  try {
    await Medicine.findByIdAndUpdate(req.params.id, {
      name: medicineName,
      stock: Number(stock),
    });

    res.redirect('/medicines'); // Redirect to the medicines list after updating
  } catch (err) {
    console.error(err);
    res.status(500).send('Error updating medicine');
  }
});

// Delete Medicine
router.get('/deleteMedicine/:id',async (req, res) => {
  try {
    await Medicine.findByIdAndDelete(req.params.id);
    res.redirect('/medicines');
  } catch (err) {
    console.error(err);
    res.redirect('/medicines');
  }
});

module.exports = router;
