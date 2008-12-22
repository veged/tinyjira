#!/usr/bin/env perl

use strict;
use warnings;


=head1 NAME

process.pl - generate css files from templates

=head1 SYNOPSIS

    process.pl                  # process all *.css.tt from script dir
    process.pl FILE1 FILE2 ...  # process specified files

=cut

use Getopt::Long;
use Pod::Usage;

{
    my $help;
    GetOptions(
        'h|help'    => \$help,
    ) or pod2usage(2);
    pod2usage(1) if $help;
}

use Cwd qw(getcwd);
use File::Spec;

use FindBin qw($Bin);

use Template;

my $tt = Template->new(ABSOLUTE => 1);

require "$Bin/vars.conf";
use vars qw($vars);

my @FILES = @ARGV;
unless (@FILES) {
    @FILES = glob "$Bin/*.css.tt";
}

for my $template (@FILES) {
    my $target = $template;
    $target =~ s{\.css\.tt$}{.css} or die "$template doesn't end with .css.tt";
    $tt->process($template, $vars, $target) || die $tt->error;
    print "$template => $target \n";
}
