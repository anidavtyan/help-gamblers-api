const mongoose = require('mongoose');
// Define the schema for the bonus data
const bonusSchema = new mongoose.Schema({
    title: String,
    slug: String,
    bonusType: { type: mongoose.Schema.Types.ObjectId, ref: 'bonustypes' },
    casino: { type: mongoose.Schema.Types.ObjectId, ref: 'casinos' },
    isVisible: Boolean,
});
const languageSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        unique: true // Ensures uniqueness for the slug
    },
});
const bonusTypeSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        unique: true // Ensures uniqueness for the slug
    },
});



// Create a Mongoose model
const Bonus = mongoose.model('bonus', bonusSchema);
const BonusType = mongoose.model('bonustypes', bonusTypeSchema);
const Casino = mongoose.model('casinos', languageSchema);

const getBonusesList = async (event, context) => {
    let db;
    try {
        const type = event.queryStringParameters?.type || '';
        const page = event.queryStringParameters?.page || 1;
        const limit = event.queryStringParameters?.limit || 10;

        await mongoose.connect('mongodb+srv://admin:admin@serverlessinstance0.bgygfhf.mongodb.net/main?retryWrites=true&w=majority', {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        const condition = {
            isVisible: true,
        };
        const sort  = { title: 1 };
        if (type) {
            const bonusType = await BonusType.findOne({slug: type});
            if(!bonusType)   {
                return {
                    statusCode: 200,
                    body: JSON.stringify({records: [], total: 0}),
                    headers: {
                        'Content-Type': 'application/json',
                        "Access-Control-Allow-Origin": "*",
                    },
                };
            }
            condition['bonusType'] = bonusType._id;
        }
        const pageNumber = parseInt(page);
        const limitNumber = parseInt(limit);
        const skip = (pageNumber - 1) * limitNumber;

        // Connect to the MongoDB database
        // Query the bonuss from the database
        const bonuses = await Bonus.find(condition)
            .select('title casino bonusType slug')
            .populate('casino', 'title logo')
            .populate('bonusType', 'title slug')
            .sort(sort)
            .skip(skip)
            .limit(limitNumber)
            .lean()
            .exec();
        const total = await Bonus.count(condition);
        await mongoose.connection.close();
        return {
            statusCode: 200,
            body: JSON.stringify({records: bonuses, total}),
            headers: {
                'Content-Type': 'application/json',
                "Access-Control-Allow-Origin": "*",
            },
        };
    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'An error occurred' }),
        };
    } finally {
        if (db) db.connection.close();
    }

};

exports.handler = getBonusesList;