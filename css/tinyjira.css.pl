use Template;
my $tt = Template->new;

my %colors1 = (
    main => '091019',
    main_background => 'fff',
    submain => '374963',
    submain_background => 'AEBBCF',
    submain_background2 => '7E91AB',
    link => '2358A3',
    link_hover => 'A31D20'
);
my %colors = (
    main => '0a192c',
    main_background => 'fcfdfe',
    main_background_hack => 'fefefe',
    submain => '255594',
    submain_background => 'cedff5',
    submain_background2 => 'a3c2eb',
    link => '123e78',
    link_hover => 'b82727'
);
$tt->process('css/tinyjira.css.tt',
    { colors => \%colors }
    ) || die $tt->error;
