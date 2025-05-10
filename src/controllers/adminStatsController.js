export async function getDailyActiveUsers(req, res) {
  // e.g. aggregate QuizAttempt or LoginHistory by day:
  const data = await LoginHistory.aggregate([
    {
      $match: {
        at: { 
          $gte: new Date(Date.now() - 7*24*60*60*1000)
        }
      }
    },
    {
      $group: {
        _id: {
          $dateToString: { format: "%Y-%m-%d", date: "$at" }
        },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);
  // transform { _id: "2025-05-01", count: 23 } → { date, count }
  const dau = data.map(d => ({ date: d._id, count: d.count }));
  res.json(dau);
}
