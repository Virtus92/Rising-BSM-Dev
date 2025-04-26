/**
 * User Activation Utility
 * 
 * This script activates a user by setting their status to "active"
 * Run with: node scripts/activateUser.js <userId>
 * Example: node scripts/activateUser.js 3
 */

// Import required packages
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Activates a user by ID
 * @param {number} userId - The ID of the user to activate
 */
async function activateUser(userId) {
  try {
    // First check if the user exists
    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) },
      select: { id: true, name: true, email: true, status: true }
    });

    if (!user) {
      console.error(`Error: User ${userId} not found`);
      return;
    }

    console.log('Current user information:');
    console.log(`ID: ${user.id}`);
    console.log(`Name: ${user.name}`);
    console.log(`Email: ${user.email}`);
    console.log(`Status: ${user.status}`);

    // If already active, no need to update
    if (user.status === 'active') {
      console.log(`\nUser ${userId} is already active. No changes needed.`);
      return;
    }

    // Update the user status to "active"
    const updatedUser = await prisma.user.update({
      where: { id: parseInt(userId) },
      data: { 
        status: 'active',
        updatedAt: new Date()
      }
    });

    console.log(`\nSuccessfully activated user ${userId}:`);
    console.log(`ID: ${updatedUser.id}`);
    console.log(`Name: ${updatedUser.name}`);
    console.log(`Email: ${updatedUser.email}`);
    console.log(`Status: ${updatedUser.status}`);
    console.log('\nThe user should now be able to log in successfully.');
    
    // Log the change to user activity
    await prisma.userActivity.create({
      data: {
        userId: parseInt(userId),
        activity: 'STATUS_CHANGE',
        details: `Status changed from ${user.status} to active via activation script`,
        timestamp: new Date(),
      }
    });
    
    console.log('Activity logged to user history.');

  } catch (error) {
    console.error('Error activating user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Get the user ID from command line arguments
const userId = process.argv[2];

if (!userId) {
  console.error('Error: Please provide a user ID');
  console.log('Usage: node scripts/activateUser.js <userId>');
  process.exit(1);
}

// Run the activation function
activateUser(userId).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
