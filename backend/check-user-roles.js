// Database User Role Check Script
// Run this with: node check-user-roles.js

const mongoose = require('mongoose');

// User Schema (should match your backend model)
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  firebaseUid: { type: String, required: true, unique: true },
  role: { type: String, enum: ['customer', 'vendor', 'admin'], default: null },
  authProvider: { type: String, required: true },
  avatar: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/migo-marketplace', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Check user roles in database
const checkUserRoles = async () => {
  try {
    console.log('\n🔍 Checking user roles in database...\n');

    // Get all users
    const allUsers = await User.find({});
    console.log(`📊 Total users in database: ${allUsers.length}`);

    // Users with roles
    const usersWithRoles = await User.find({ role: { $ne: null } });
    console.log(`✅ Users with roles: ${usersWithRoles.length}`);

    // Users without roles (null or undefined)
    const usersWithoutRoles = await User.find({ 
      $or: [
        { role: null }, 
        { role: { $exists: false } }
      ] 
    });
    console.log(`❌ Users without roles: ${usersWithoutRoles.length}`);

    // Role distribution
    const roleStats = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ]);

    console.log('\n📈 Role Distribution:');
    roleStats.forEach(stat => {
      const roleName = stat._id || 'NO ROLE';
      console.log(`   ${roleName}: ${stat.count} users`);
    });

    // Show users without roles
    if (usersWithoutRoles.length > 0) {
      console.log('\n👥 Users without roles:');
      usersWithoutRoles.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.email} (${user.name}) - UID: ${user.firebaseUid}`);
      });
    }

    // Show recent users (last 10)
    console.log('\n🕐 Recent users (last 10):');
    const recentUsers = await User.find({}).sort({ createdAt: -1 }).limit(10);
    recentUsers.forEach((user, index) => {
      const roleDisplay = user.role || 'NO ROLE';
      console.log(`   ${index + 1}. ${user.email} - Role: ${roleDisplay} - Created: ${user.createdAt.toLocaleDateString()}`);
    });

    return {
      total: allUsers.length,
      withRoles: usersWithRoles.length,
      withoutRoles: usersWithoutRoles.length,
      usersNeedingRoles: usersWithoutRoles
    };

  } catch (error) {
    console.error('❌ Error checking user roles:', error);
    throw error;
  }
};

// Main function
const main = async () => {
  await connectDB();
  const results = await checkUserRoles();
  
  console.log('\n📋 Summary:');
  console.log(`   • Total users: ${results.total}`);
  console.log(`   • Users with roles: ${results.withRoles}`);
  console.log(`   • Users needing roles: ${results.withoutRoles}`);
  
  if (results.withoutRoles > 0) {
    console.log('\n⚠️  ACTION NEEDED: Some users don\'t have roles assigned.');
    console.log('   Run the migration script to fix this: node migrate-user-roles.js');
  } else {
    console.log('\n✅ All users have roles assigned!');
  }
  
  mongoose.connection.close();
  console.log('\n🔌 Database connection closed.');
};

// Run the script
if (require.main === module) {
  main().catch(error => {
    console.error('Script failed:', error);
    process.exit(1);
  });
}

module.exports = { checkUserRoles }; 