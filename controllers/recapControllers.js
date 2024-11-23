import monthRecap from "../models/MonthRecap.js";
import axios from "axios";

export const recapData = async (req, res) => {
    const userId = req.query.userId 
    try { 
        const recaps = await monthRecap.find({userId: userId})
        if (recaps.length===0) {
            return res.status(404).json({success: false, message: "No recaps found"})
        }
        return res.status(200).json({success: true, recaps})
    } catch (error) {
        return res.status(500).json({success: false, message: error.message})
    }
}

export const createRecap = async (req, res) => {
    const userId = req.body.userId;
    const {
        recapName,
        month,
        moodSummary,
        summary,
        favoriteDay,
        totalEntries
    } = req.body;

    try {
        const newRecap = await monthRecap.create({
            userId: userId,
            recapName: recapName,
            month: month,
            moodSummary: moodSummary,
            summary: summary,
            favoriteDay: favoriteDay,
            totalEntries: totalEntries
        });

        return res.status(201).json({ success: true, newRecap });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};


export const deleteRecap = async (req, res) => {
    const userId = req.query.userId 
    const { recapId } = req.query 
    try {
        const recap = await monthRecap.findOneAndDelete({_id: recapId, userId: userId })
        if (!recap) {
            return res.status(404).json({success: false, message: "Recap not found"})
        }
        return res.status(200).json({success: true, message: "Recap deleted succesfully"})
    } catch (error) {
        return res.status(500).json({success: false, message: error.message})
    }
}

export const generateRecap = async (req, res) => {
    const apiKey = process.env.OPENAI_API_KEY;
  
    if (!apiKey) {
      return res.status(500).json({ success: false, message: 'OpenAI API key not configured' });
    }
  
    const { monthEntries, recapMonth } = req.body;
  
    try {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4',
          messages: [
            {
              role: 'user',
              content: `You are a helpful assistant. Your task is to process journal entry data and return a structured JSON object based on the provided schema. 
  
  Here is the array of journal entry objects:
  ${JSON.stringify(monthEntries)}
  
  This array contains journal entries for the month of ${recapMonth}. Your task is to create a monthly recap in the context of an emotional journal app. 
  
  ### Instructions:
  1. **ONLY** return the JSON object. Do not include any additional text, explanations, or comments. 
  2. The JSON should strictly match this schema:
     {
        "recapName": "string",
        "month": "Date",
        "moodSummary": { "😊": number, "😔": number }, //<-Example, give me the ACTUAL emoji count of the input
        "summary": "string",
        "favoriteDay": { "date": "Date", "description": "string" },
        "totalEntries": number
     }
  3. Ensure all fields in the JSON object are valid and formatted properly.
  4. If you encounter any missing or ambiguous data in the input, make reasonable assumptions but adhere to the schema.
  
  ### Example Output:
  {
    "recapName": "Your Monthly Reflection",
    "month": "2024-11-01T00:00:00.000Z",
    "moodSummary": { "😊": 5, "😔": 2, "🤣": 3 },
    "summary": "...", (this should be the bulk of the text)
    "favoriteDay": { "date": "2024-11-05T00:00:00.000Z", "description": "..." },
    "totalEntries": 10
  }
  
  Return only the JSON object as shown above. Use language like "you...", do NOT say "user...", that is too cold. Almost you should be talking about the month recap in PAST tense.`,
            },
          ],
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );
  
      const content = response.data.choices?.[0]?.message?.content;
  
      if (!content) {
        throw new Error('No valid response from OpenAI');
      }
  
      let recapData;
      try {
        recapData = JSON.parse(content);
      } catch (parseError) {
        throw new Error('Failed to parse OpenAI response into JSON');
      }
  
      return res.status(200).json({ success: true, recap: recapData });
    } catch (error) {
      console.error('Error details:', error.response?.data || error.message);
      return res.status(500).json({ success: false, message: error.message });
    }
  };