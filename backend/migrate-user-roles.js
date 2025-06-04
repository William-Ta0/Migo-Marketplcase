// User Role Migration Script
// Run this with: node migrate-user-roles.js

const mongoose = require('mongoose');
const readline = require('readline');

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

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Helper function to ask questions
const askQuestion = (question) => {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
};

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

// Migration strategies
const migrationStrategies = {
  // Strategy 1: Set all users without roles to 'customer' by default
  setAllToCustomer: async (usersWithoutRoles) => {
    console.log('\n🔄 Setting all users without roles to "customer"...');
    
    const result = await User.updateMany(
      { 
        $or: [
          { role: null }, 
          { role: { $exists: false } }
        ] 
      },
      { 
        role: 'customer', 
        updatedAt: new Date() 
      }
    );
    
    console.log(`✅ Updated ${result.modifiedCount} users to "customer" role`);
    return result.modifiedCount;
  },

  // Strategy 2: Interactive assignment for each user
  interactiveAssignment: async (usersWithoutRoles) => {
    console.log('\n🎯 Interactive role assignment...');
    let updatedCount = 0;

    for (const user of usersWithoutRoles) {
      console.log(`\n👤 User: ${user.name} (${user.email})`);
      console.log(`   Created: ${user.createdAt.toLocaleDateString()}`);
      console.log(`   Firebase UID: ${user.firebaseUid}`);
      
      const roleChoice = await askQuestion('   What role should this user have? (customer/vendor/admin/skip): ');
      
      if (['customer', 'vendor', 'admin'].includes(roleChoice.toLowerCase())) {
        try {
          await User.findByIdAndUpdate(user._id, { 
            role: roleChoice.toLowerCase(), 
            updatedAt: new Date() 
          });
          console.log(`   ✅ Assigned "${roleChoice.toLowerCase()}" role`);
          updatedCount++;
        } catch (error) {
          console.log(`   ❌ Failed to update user: ${error.message}`);
        }
      } else if (roleChoice.toLowerCase() === 'skip') {
        console.log('   ⏭️  Skipped');
      } else {
        console.log('   ❌ Invalid role, skipping user');
      }
    }

    console.log(`\n✅ Updated ${updatedCount} users with roles`);
    return updatedCount;
  },

  // Strategy 3: Smart assignment based on user data/patterns
  smartAssignment: async (usersWithoutRoles) => {
    console.log('\n🧠 Smart role assignment based on user patterns...');
    let updatedCount = 0;

    for (const user of usersWithoutRoles) {
      let suggestedRole = 'customer'; // Default

      // Smart logic - you can customize this based on your business rules
      if (user.email.includes('admin') || user.email.includes('support')) {
        suggestedRole = 'admin';
      } else if (user.email.includes('vendor') || user.email.includes('seller') || user.email.includes('provider')) {
        suggestedRole = 'vendor';
      }
      // Add more smart logic here based on your patterns

      try {
        await User.findByIdAndUpdate(user._id, { 
          role: suggestedRole, 
          updatedAt: new Date() 
        });
        console.log(`   ✅ ${user.email} → "${suggestedRole}" (smart assignment)`);
        updatedCount++;
      } catch (error) {
        console.log(`   ❌ Failed to update ${user.email}: ${error.message}`);
      }
    }

    console.log(`\n✅ Updated ${updatedCount} users with smart role assignment`);
    return updatedCount;
  }
};

// Main migration function
const migrateUserRoles = async () => {
  try {
    console.log('\n🔍 Finding users without roles...');

    // Find users without roles
    const usersWithoutRoles = await User.find({ 
      $or: [
        { role: null }, 
        { role: { $exists: false } }
      ] 
    });

    if (usersWithoutRoles.length === 0) {
      console.log('✅ All users already have roles assigned!');
      return;
    }

    console.log(`\n📊 Found ${usersWithoutRoles.length} users without roles:`);
    usersWithoutRoles.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.email} (${user.name})`);
    });

    // Ask user to choose migration strategy
    console.log('\n🛠️  Choose migration strategy:');
    console.log('   1. Set all to "customer" (quick fix)');
    console.log('   2. Interactive assignment (manual for each user)');
    console.log('   3. Smart assignment (based on email patterns)');
    console.log('   4. Cancel migration');

    const strategy = await askQuestion('\nEnter your choice (1-4): ');

    let updatedCount = 0;

    switch (strategy) {
      case '1':
        updatedCount = await migrationStrategies.setAllToCustomer(usersWithoutRoles);
        break;
      case '2':
        updatedCount = await migrationStrategies.interactiveAssignment(usersWithoutRoles);
        break;
      case '3':
        updatedCount = await migrationStrategies.smartAssignment(usersWithoutRoles);
        break;
      case '4':
        console.log('❌ Migration cancelled');
        return;
      default:
        console.log('❌ Invalid choice, migration cancelled');
        return;
    }

    // Verify the migration
    console.log('\n🔍 Verifying migration...');
    const remainingUsersWithoutRoles = await User.find({ 
      $or: [
        { role: null }, 
        { role: { $exists: false } }
      ] 
    });

    console.log(`\n📈 Migration Results:`);
    console.log(`   • Users updated: ${updatedCount}`);
    console.log(`   • Users still without roles: ${remainingUsersWithoutRoles.length}`);

    if (remainingUsersWithoutRoles.length === 0) {
      console.log('🎉 Migration completed successfully! All users now have roles.');
    } else {
      console.log('⚠️  Some users still need roles. You may want to run the migration again.');
    }

  } catch (error) {
    console.error('❌ Error during migration:', error);
    throw error;
  }
};

// Backup function (optional)
const createBackup = async () => {
  try {
    console.log('💾 Creating backup of current user data...');
    
    const allUsers = await User.find({});
    const backup = {
      timestamp: new Date().toISOString(),
      users: allUsers
    };

    const fs = require('fs');
    const backupFile = `user-backup-${new Date().toISOString().split('T')[0]}.json`;
    fs.writeFileSync(backupFile, JSON.stringify(backup, null, 2));
    
    console.log(`✅ Backup created: ${backupFile}`);
    return backupFile;
  } catch (error) {
    console.error('❌ Failed to create backup:', error);
    throw error;
  }
};

// Main function
const main = async () => {
  try {
    await connectDB();

    // Ask if user wants to create a backup
    const shouldBackup = await askQuestion('Create a backup before migration? (y/n): ');
    if (shouldBackup.toLowerCase() === 'y' || shouldBackup.toLowerCase() === 'yes') {
      await createBackup();
    }

    await migrateUserRoles();
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    rl.close();
    mongoose.connection.close();
    console.log('\n🔌 Database connection closed.');
  }
};

// Run the script
if (require.main === module) {
  console.log('🚀 User Role Migration Script');
  console.log('=====================================');
  main();
}

module.exports = { migrateUserRoles, migrationStrategies }; 