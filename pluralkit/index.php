<?php

$user = $_GET['user'] ?? null;
$inputJSON = file_get_contents('php://input');
$input = json_decode($inputJSON, true);
$data = json_decode(file_get_contents("../data/fronters.json"), true);

if ($user === null) {
    header("HTTP/1.1 500 Internal Server Error") and die();
}

if (!in_array($user, array_keys($data))) {
    header("HTTP/1.1 404 Not Found") and die();
}

if ($input["signing_token"] !== $data[$user]["token"]) {
    header("HTTP/1.1 401 Unauthorized") and die();
}

if ($input["type"] === "CREATE_SWITCH" || $input["type"] === "UPDATE_SWITCH" || $input["type"] === "DELETE_SWITCH") {
    $data[$user]["system"] = $input["system_id"];
    if (isset($input["data"]) && isset($input["data"]["members"])) {
        $data[$user]["fronters"] = $input["data"]["members"];
    } else {
        sleep(rand(1, 3));
        $data[$user]["fronters"] = array_map(function ($i) {
            return $i['uuid'];
        }, json_decode(file_get_contents("https://api.pluralkit.me/v2/systems/$input[system_id]/fronters"), true)["members"]);
    }
}

file_put_contents("../data/fronters.json", json_encode($data, JSON_PRETTY_PRINT));