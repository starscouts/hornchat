<?php

if (php_sapi_name() !== "cli") die();
$data = json_decode(file_get_contents("../../data/pluralkit.json"), true);

foreach ($data as $name => $info) {
    if (json_decode(file_get_contents("https://api.pluralkit.me/v2/systems/exmpl"), true)["uuid"] !== "3be61c07-9a44-43a5-8d06-9d1253f2a830") die();

    $data[$name] = [
        "id" => $info["id"],
    ];

    sleep(rand(1, 3));

    $system = json_decode(file_get_contents("https://api.pluralkit.me/v2/systems/$info[id]"), true);
    $data[$name]["system"] = [
        "name" => $system["name"],
        "avatar" => $system["avatar_url"]
    ];
    sleep(1);

    $data[$name]["members"] = [];

    foreach (json_decode(file_get_contents("https://api.pluralkit.me/v2/systems/$info[id]/members"), true) as $member) {
        $url = $member["avatar_url"] ?? $system["avatar_url"];

        if (!file_exists("../../public/assets")) mkdir("../../public/assets");
        if (!file_exists("../../public/assets/" . $member["uuid"])) mkdir("../../public/assets/" . $member["uuid"]);

        exec("convert -resize 512x512 \"" . $url . "\" \"../../public/assets/" . $member["uuid"] . "/512.jpg\"");
        exec("convert -resize 256x256 \"" . $url . "\" \"../../public/assets/" . $member["uuid"] . "/256.jpg\"");
        exec("convert -resize 128x128 \"" . $url . "\" \"../../public/assets/" . $member["uuid"] . "/128.jpg\"");
        exec("convert -resize 96x96 \"" . $url . "\" \"../../public/assets/" . $member["uuid"] . "/96.jpg\"");
        exec("convert -resize 64x64 \"" . $url . "\" \"../../public/assets/" . $member["uuid"] . "/64.jpg\"");
        exec("convert -resize 48x48 \"" . $url . "\" \"../../public/assets/" . $member["uuid"] . "/48.jpg\"");
        exec("convert -resize 32x32 \"" . $url . "\" \"../../public/assets/" . $member["uuid"] . "/32.jpg\"");
        exec("convert -resize 24x24 \"" . $url . "\" \"../../public/assets/" . $member["uuid"] . "/24.jpg\"");
        exec("convert -resize 16x16 \"" . $url . "\" \"../../public/assets/" . $member["uuid"] . "/16.jpg\"");

        $data[$name]["members"][$member["uuid"]] = [
            "id" => $member["uuid"],
            "name" => $member["display_name"] ?? $member["name"],
            "avatar" => "/assets/" . $member["uuid"] . "/128.jpg",
            "color" => $member["color"] ?? "ffffff",
            "proxy" => $member["proxy_tags"] ?? [],
        ];
    }
    sleep(1);
}

file_put_contents("../../data/pluralkit.json", json_encode($data, JSON_PRETTY_PRINT));