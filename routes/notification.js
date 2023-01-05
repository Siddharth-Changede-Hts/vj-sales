var express = require("express");
var router = express.Router();

var supabase = require("../services/supabaseClient").supabase;

router.get("/", async function (req, res, next) {
  res.send({ success: true });
});

router.post("/eventUpdateNotification", async (req, res, next) => {

  const {action, eventId} = req.body;

  try {
    const eventResponse = await supabase.from("LaunchCpRelations").select("cpId, launchId(eventId)").eq("launchId.eventId", eventId);
    if (eventResponse.data) {
      res.send({ success: true, message: "Notification sending start." });
      
      let notificationSenderArray = [];
      for (const cpRelationObject of eventResponse.data) {
        //* insert cp notification {cpRelationObject.cpId}
        await supabase.from("EventNotificationsForCp").insert({cpId:cpRelationObject.cpId, eventId, action});
        const fosTableResponse = await supabase.from("FOS").select("fosId").eq("approvalStatus", "approved").eq("cpId", cpRelationObject.cpId);
        for (const fosObject of fosTableResponse.data) {
          //* insert FOS notification {fosObject.fosId}
          await supabase.from("EventNotificationsForFos").insert({fosId:fosObject.fosId, eventId, action})
        }
        notificationSenderArray.push({...cpRelationObject, fos: fosTableResponse.data})
      }

      // res.send({ success: true, data: notificationSenderArray });

      console.log("\x1b[47m",'\x1b[32m', 'Notification Send Successfully.' , "\x1b[0m");

    } else {
      res.send({ success: false, error: eventResponse.error });
    }    
  } catch (error) {
    console.error("catch Error  => ", error);
    res.send({ success: false, error: error });
  }

})


module.exports = router;
