const mongoose = require('mongoose');
const Review = require('./models/Review');
const User = require('./models/User');
const Service = require('./models/Service');

async function recalculateAllRatings() {
  try {
    await mongoose.connect('mongodb://localhost:27017/migo_marketplace', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('🔗 Connected to MongoDB');

    // Get all unique vendor IDs with reviews
    const vendorIds = await Review.distinct('vendor');
    console.log(`📊 Found ${vendorIds.length} vendors with reviews`);

    // Recalculate vendor ratings
    for (const vendorId of vendorIds) {
      console.log(`🔄 Recalculating ratings for vendor: ${vendorId}`);
      await Review.updateVendorRating(vendorId);
    }

    // Get all unique service IDs with reviews
    const serviceIds = await Review.distinct('service');
    console.log(`📊 Found ${serviceIds.length} services with reviews`);

    // Recalculate service ratings
    for (const serviceId of serviceIds) {
      console.log(`🔄 Recalculating ratings for service: ${serviceId}`);
      await Review.updateServiceRating(serviceId);
    }

    // Verify results
    console.log('\n✅ Recalculation complete! Updated ratings:');
    
    for (const vendorId of vendorIds) {
      const vendor = await User.findById(vendorId).select('firstName lastName vendorInfo.rating');
      const reviews = await Review.find({ vendor: vendorId, status: 'approved' });
      
      if (reviews.length > 0) {
        console.log(`\n👤 ${vendor.firstName} ${vendor.lastName}:`);
        console.log(`   Database rating: ${vendor.vendorInfo.rating.average} (${vendor.vendorInfo.rating.count} reviews)`);
        
        // Show individual review calculations
        reviews.forEach((review, i) => {
          const { overall, quality, communication, punctuality, professionalism, value } = review.ratings;
          const calculated = ((overall + quality + communication + punctuality + professionalism + value) / 6).toFixed(1);
          console.log(`   Review ${i + 1}: [${overall}, ${quality}, ${communication}, ${punctuality}, ${professionalism}, ${value}] = ${calculated}`);
        });
      }
    }

    await mongoose.disconnect();
    console.log('\n🏁 Done!');

  } catch (error) {
    console.error('❌ Error recalculating ratings:', error);
    process.exit(1);
  }
}

recalculateAllRatings(); 