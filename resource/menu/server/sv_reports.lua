---@class ReportMessage
---@field reportId string
---@field message string
---@field author_name string
---@field author_license string

---@class ReportOpenPayload
---@field subject string
---@field author_name string
---@field author_license string

---@class ReportData
---@field reportId string
---@field author_src any server id
---@field listeners any[] server id list of all people having interacted

-- List the licenses to a reportId, avoids a player sending reports to other reports
-- ToDo: on server restart consider fetching active reports ? Currently closure is handled manually by the core.
local ticketMap = {}

-- map of license to svid for confirming ticket opening
local ticketRequests = {} 

---send data from event handler to web using "webpipe" like in sv_webpipe.lua<br>Permission checks **HAVE** to be done prior to calling this
---@param action 'get' | 'open' | 'message' | 'close'
---@param src any
---@param license string
---@param payload { subject: string; } | ReportMessage | { reportId: string }
local function sendReportWebPipeRequest(action, src, license, payload)
    if type(payload.reportId) ~= 'string' then return end

    local path
    if action == 'get' then
        path = '/reports'
    elseif action == 'message' then
        path = '/reports/message'
    elseif action == 'open' then
        path = '/reports/open'
    elseif action == 'close' then
        path = '/reports/close'
    end

    local url = "http://" .. (TX_LUACOMHOST .. '/' .. path):gsub("//+", "/")

    PerformHttpRequest(url, function(httpCode, data, resultHeaders)
        print('report message webpipe thingy magig response received')
        print(httpCode, json.encode(data, {indent=true}))
    end)
end

---@param message string
RegisterNetEvent('txsv:reports:message', function (message, reportId)
    local src = source
    local playerLicense = GetPlayerIdentifierByType(src, 'license')
    local playerName = GetPlayerName(src)

    if not TX_ADMINS[src] then
        reportId = ticketMap[playerLicense]
    end

    -- No open ticket ? No sending Message.
    if not reportId then return end

    sendReportWebPipeRequest('message', src, playerLicense, {
        reportId = reportId,
        message = message,
        author_license = playerLicense,
        author_name = playerName,
    })
end)

---@param subject string
RegisterNetEvent('txsv:reports:open', function (subject)
    local src = source
    local playerLicense = GetPlayerIdentifierByType(src, 'license')
    local playerName = GetPlayerName(src)
    local reportId = ticketMap[playerLicense]

    -- Open ticket ? No opening a new one
    if reportId then return end

    sendReportWebPipeRequest('open', src, playerLicense, {
        subject = subject,
        author_license = playerLicense,
        author_name = playerName,
    })
end)

---@param reportId string
RegisterNetEvent('txsv:reports:close', function (reportId)
    local src = source
    local playerLicense = GetPlayerIdentifierByType(src, 'license')

    -- Only authed admins can do that 
    if not TX_ADMINS[src] then return end

    sendReportWebPipeRequest('close', src, playerLicense, {
        reportId = reportId,
    })
end)

--- Listen for new messages sent via the web panel
---@param source 0
---@param args ReportMessage
RegisterCommand('newReportMessage', function (source, args)
    print('^5newReportMessage^7', source, json.encode(args))
    if source ~= 0 then return end

    local reportId = args.reportId

    local targetSvId = ticketMap[reportId]?.author_src

    if not targetSvId then return end

    -- ToDo: notify user of report update & for him to save the data
end, true)

--- Listen for closure request via the web panel
---@param source 0
---@param args { reportId: string; }
RegisterCommand('closeReport', function (source, args)
    print('^4closeReport^7', source, json.encode(args))
    if source ~= 0 then return end

    local reportId = args.reportId

    local targetSvId = ticketMap[reportId]?.author_src

    if not targetSvId then return end -- desync between both ends, ignoring is good ?

    ticketMap[reportId] = nil

    -- ToDo: notify user of report closure
end, true)

--- Listen for opening confirmation
---@param source 0
---@param args { reportId: string; author_license: string; subject: string; }
RegisterCommand('newReport', function (source, args)
    print('^4newReport^7', source, json.encode(args))
    if source ~= 0 then return end

    local reportId = args.reportId
    local author_src = ticketRequests[args.author_license]

    ticketMap[reportId] = {
        reportId = reportId,
        subject =  args.subject,
        author_src = author_src,
        listeners = {},
    }

    -- ToDo: send confirmation of opening to user, update his UI from open modal state to chat box
end, true)
