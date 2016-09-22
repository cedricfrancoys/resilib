<?php

require_once('resilib.api.php');

$params['lang'] = 'fr';

/*
$categories = get_categories_flat('', true);

$categories = get_categories('', true);
print_r($categories);
*/

/*
foreach($categories as $category) {
    $meta = get_category_meta($category);
    $cat_meta['title'][$params['lang']
}

*/
function getSanitizedName($file_name) {
    $special_chars = array("?", "[", "]","\\", "=", "<", ">", ":", ";", ",", "'", "\"", "&", "$", "#", "*", "(", ")", "|", "~", "`", "!", "{", "}");
    // remove accentuated chars
    $file_name = htmlentities($file_name, ENT_QUOTES, 'UTF-8');    
    $file_name = preg_replace('~&([a-z|A-Z]{1,2})(acute|cedil|circ|grave|lig|orn|ring|slash|th|tilde|uml);~i', '$1', $file_name);
    $file_name = html_entity_decode($file_name, ENT_QUOTES, 'UTF-8');
    // remove special chars
    $file_name = str_replace($special_chars, '', $file_name);
    // replace spaces with underscore
    $file_name = preg_replace('/[\s-]+/', '-', $file_name);
    // trim the end of the string
    $file_name = trim($file_name, '.-_');
    return $file_name;
}

function get_cats($root='', $recurse=true, $part='') {
    global $params;

    if ($handle = @opendir(HOME_DIR.'categories/'.$root)) {
        while (false !== ($entry = readdir($handle))) {
            $filepath = HOME_DIR.'categories/'.$root.'/'.$entry;
            if(!in_array($entry, ['.', '..']) && is_dir($filepath)) {
                if(strlen($root)) $entry = $root.'/'.$entry; 	
                $cat_meta = get_category_meta($entry);
                $title = $cat_meta['title'][$params['lang']];
                if($part) $title = $part.'/'.$title;
                $title = getSanitizedName(str_replace('&', 'et', $title));
                echo "INSERT INTO `resiexchange`.`pligg_tags` (`tag_lang`, `tag_words`) VALUES ('fr', '$title');\n";
                if($recurse) {
                    get_cats($entry, true, $title);
                }
            }
        }
        closedir($handle);
    }

}

get_cats();