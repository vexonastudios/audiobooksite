const fs = require('fs');
const path = require('path');

const html = `
    <h2>Featured Authors</h2>
    <div class="featured-contributors author-grid">
              <div class="author-box featured-author-box">
          <a href="https://scrollreader.com/author/embounds/" class="author-link">
                        <img src="https://scrollreader.com/wp-content/uploads/embounds-1.webp"
                 width="160" height="160"
                 class="author-image" />
            <div class="author-info">
              <h3>E.M. Bounds</h3>
              <span>6 posts</span>
            </div>
          </a>
        </div>
              <div class="author-box featured-author-box">
          <a href="https://scrollreader.com/author/gardinerspring/" class="author-link">
                        <img src="https://scrollreader.com/wp-content/uploads/gardinerspring.jpg"
                 width="160" height="160"
                 class="author-image" />
            <div class="author-info">
              <h3>Gardiner Spring</h3>
              <span>5 posts</span>
            </div>
          </a>
        </div>
              <div class="author-box featured-author-box">
          <a href="https://scrollreader.com/author/henryfrost/" class="author-link">
                        <img src="https://scrollreader.com/wp-content/uploads/henyfrost.webp"
                 width="160" height="160"
                 class="author-image" />
            <div class="author-info">
              <h3>Henry Frost</h3>
              <span>2 posts</span>
            </div>
          </a>
        </div>
          </div>

    <div class="explore-header">
      <h2>Explore by Person or Author</h2>
    </div>

    <div class="all-authors author-grid">
              <div class="author-box">
          <a href="https://scrollreader.com/author/aeglover/" class="author-link">
                        <img src="https://scrollreader.com/wp-content/uploads/aeglover.webp"
                 width="140" height="140"
                 class="author-image small-author-image" />
            <div class="author-info">
              <h3>A.E. Glover</h3>
              <span>1 posts</span>
            </div>
          </a>
        </div>
              <div class="author-box">
          <a href="https://scrollreader.com/author/ajgordon/" class="author-link">
                        <img src="https://beta.scrollreader.com/wp-content/uploads/ajgordon.webp"
                 width="140" height="140"
                 class="author-image small-author-image" />
            <div class="author-info">
              <h3>A.J. Gordon</h3>
              <span>2 posts</span>
            </div>
          </a>
        </div>
              <div class="author-box">
          <a href="https://scrollreader.com/author/atpierson/" class="author-link">
                        <img src="https://scrollreader.com/wp-content/uploads/atpierson-1.webp"
                 width="140" height="140"
                 class="author-image small-author-image" />
            <div class="author-info">
              <h3>A.T. Pierson</h3>
              <span>4 posts</span>
            </div>
          </a>
        </div>
              <div class="author-box">
          <a href="https://scrollreader.com/author/awtozer/" class="author-link">
                        <img src="https://scrollreader.com/wp-content/uploads/awtozer.jpg"
                 width="140" height="140"
                 class="author-image small-author-image" />
            <div class="author-info">
              <h3>A.W. Tozer</h3>
              <span>1 posts</span>
            </div>
          </a>
        </div>
              <div class="author-box">
          <a href="https://scrollreader.com/author/adalee/" class="author-link">
                        <img src="https://scrollreader.com/wp-content/uploads/adalee.webp"
                 width="140" height="140"
                 class="author-image small-author-image" />
            <div class="author-info">
              <h3>Ada Lee</h3>
              <span>2 posts</span>
            </div>
          </a>
        </div>
              <div class="author-box">
          <a href="https://scrollreader.com/author/ameliaopie/" class="author-link">
                        <img src="https://scrollreader.com/wp-content/uploads/amelia-opie.webp"
                 width="140" height="140"
                 class="author-image small-author-image" />
            <div class="author-info">
              <h3>Amelia Opie</h3>
              <span>1 posts</span>
            </div>
          </a>
        </div>
              <div class="author-box">
          <a href="https://scrollreader.com/author/amycarmichael/" class="author-link">
                        <img src="https://scrollreader.com/wp-content/uploads/amycarmicahel.webp"
                 width="140" height="140"
                 class="author-image small-author-image" />
            <div class="author-info">
              <h3>Amy Carmichael</h3>
              <span>1 posts</span>
            </div>
          </a>
        </div>
              <div class="author-box">
          <a href="https://scrollreader.com/author/andrewbonar/" class="author-link">
                        <img src="https://scrollreader.com/wp-content/uploads/andrewbonar-1.webp"
                 width="140" height="140"
                 class="author-image small-author-image" />
            <div class="author-info">
              <h3>Andrew Bonar</h3>
              <span>1 posts</span>
            </div>
          </a>
        </div>
              <div class="author-box">
          <a href="https://scrollreader.com/author/andrewfuller/" class="author-link">
                        <img src="https://scrollreader.com/wp-content/uploads/andrew-fuller.webp"
                 width="140" height="140"
                 class="author-image small-author-image" />
            <div class="author-info">
              <h3>Andrew Fuller</h3>
              <span>1 posts</span>
            </div>
          </a>
        </div>
              <div class="author-box">
          <a href="https://scrollreader.com/author/andrewmurray/" class="author-link">
                        <img src="https://scrollreader.com/wp-content/uploads/andrewmurray.webp"
                 width="140" height="140"
                 class="author-image small-author-image" />
            <div class="author-info">
              <h3>Andrew Murray</h3>
              <span>5 posts</span>
            </div>
          </a>
        </div>
              <div class="author-box">
          <a href="https://scrollreader.com/author/arabellastuart/" class="author-link">
                        <img src="https://scrollreader.com/wp-content/uploads/women.webp"
                 width="140" height="140"
                 class="author-image small-author-image" />
            <div class="author-info">
              <h3>Arabella W. Stuart</h3>
              <span>1 posts</span>
            </div>
          </a>
        </div>
              <div class="author-box">
          <a href="https://scrollreader.com/author/arthurhardy/" class="author-link">
                        <img src="https://scrollreader.com/wp-content/uploads/ArthurJosephHardy.webp"
                 width="140" height="140"
                 class="author-image small-author-image" />
            <div class="author-info">
              <h3>Arthur Hardy</h3>
              <span>1 posts</span>
            </div>
          </a>
        </div>
              <div class="author-box">
          <a href="https://scrollreader.com/author/augustusbuckland/" class="author-link">
                        <img src="https://ill-be-honest.local/wp-content/uploads/2024/07/noprofile.jpg"
                 width="140" height="140"
                 class="author-image small-author-image" />
            <div class="author-info">
              <h3>Augustus Buckland</h3>
              <span>2 posts</span>
            </div>
          </a>
        </div>
              <div class="author-box">
          <a href="https://scrollreader.com/author/bobjennings/" class="author-link">
                        <img src="https://scrollreader.com/wp-content/uploads/bobjennings-1.webp"
                 width="140" height="140"
                 class="author-image small-author-image" />
            <div class="author-info">
              <h3>Bob Jennings</h3>
              <span>1 posts</span>
            </div>
          </a>
        </div>
              <div class="author-box">
          <a href="https://scrollreader.com/author/chspurgeon/" class="author-link">
                        <img src="https://scrollreader.com/wp-content/uploads/CharlesSpurgeonProfileAudiobook.webp"
                 width="140" height="140"
                 class="author-image small-author-image" />
            <div class="author-info">
              <h3>C.H. Spurgeon</h3>
              <span>3 posts</span>
            </div>
          </a>
        </div>
              <div class="author-box">
          <a href="https://scrollreader.com/author/ctstudd/" class="author-link">
                        <img src="https://scrollreader.com/wp-content/uploads/ctstudd-1.webp"
                 width="140" height="140"
                 class="author-image small-author-image" />
            <div class="author-info">
              <h3>C.T. Studd</h3>
              <span>1 posts</span>
            </div>
          </a>
        </div>
              <div class="author-box">
          <a href="https://scrollreader.com/author/charlesbridges/" class="author-link">
                        <img src="https://scrollreader.com/wp-content/uploads/charlesbridges.webp"
                 width="140" height="140"
                 class="author-image small-author-image" />
            <div class="author-info">
              <h3>Charles Bridges</h3>
              <span>2 posts</span>
            </div>
          </a>
        </div>
              <div class="author-box">
          <a href="https://scrollreader.com/author/charlesray/" class="author-link">
                        <img src="https://scrollreader.com/wp-content/uploads/male.webp"
                 width="140" height="140"
                 class="author-image small-author-image" />
            <div class="author-info">
              <h3>Charles Ray</h3>
              <span>1 posts</span>
            </div>
          </a>
        </div>
              <div class="author-box">
          <a href="https://scrollreader.com/author/conradmurrell/" class="author-link">
                        <img src="https://beta.scrollreader.com/wp-content/uploads/Conrad-Murrell-1.webp"
                 width="140" height="140"
                 class="author-image small-author-image" />
            <div class="author-info">
              <h3>Conrad Murrell</h3>
              <span>1 posts</span>
            </div>
          </a>
        </div>
              <div class="author-box">
          <a href="https://scrollreader.com/author/dlmoody/" class="author-link">
                        <img src="https://scrollreader.com/wp-content/uploads/dlmoody.webp"
                 width="140" height="140"
                 class="author-image small-author-image" />
            <div class="author-info">
              <h3>D.L. Moody</h3>
              <span>3 posts</span>
            </div>
          </a>
        </div>
              <div class="author-box">
          <a href="https://scrollreader.com/author/darylwingerd/" class="author-link">
                        <img src="https://scrollreader.com/wp-content/uploads/Daryl_2020-300x300-1-1.webp"
                 width="140" height="140"
                 class="author-image small-author-image" />
            <div class="author-info">
              <h3>Daryl Wingerd</h3>
              <span>1 posts</span>
            </div>
          </a>
        </div>
              <div class="author-box">
          <a href="https://scrollreader.com/author/davidjdeane/" class="author-link">
                        <img src="https://scrollreader.com/wp-content/uploads/male.webp"
                 width="140" height="140"
                 class="author-image small-author-image" />
            <div class="author-info">
              <h3>David J. Deane</h3>
              <span>1 posts</span>
            </div>
          </a>
        </div>
              <div class="author-box">
          <a href="https://scrollreader.com/author/ehhamilton/" class="author-link">
                        <img src="https://scrollreader.com/wp-content/uploads/ehhamilton.webp"
                 width="140" height="140"
                 class="author-image small-author-image" />
            <div class="author-info">
              <h3>E.H. Hamilton</h3>
              <span>1 posts</span>
            </div>
          </a>
        </div>
              <div class="author-box">
          <a href="https://scrollreader.com/author/edwardbartlett/" class="author-link">
                        <img src="https://scrollreader.com/wp-content/uploads/male.webp"
                 width="140" height="140"
                 class="author-image small-author-image" />
            <div class="author-info">
              <h3>Edward Bartlett</h3>
              <span>1 posts</span>
            </div>
          </a>
        </div>
              <div class="author-box">
          <a href="https://scrollreader.com/author/edwardjudson/" class="author-link">
                        <img src="https://scrollreader.com/wp-content/uploads/male.webp"
                 width="140" height="140"
                 class="author-image small-author-image" />
            <div class="author-info">
              <h3>Edward Judson</h3>
              <span>1 posts</span>
            </div>
          </a>
        </div>
              <div class="author-box">
          <a href="https://scrollreader.com/author/edwardleighpell/" class="author-link">
                        <img src="https://ill-be-honest.local/wp-content/uploads/2024/07/noprofile.jpg"
                 width="140" height="140"
                 class="author-image small-author-image" />
            <div class="author-info">
              <h3>Edward Pell</h3>
              <span>1 posts</span>
            </div>
          </a>
        </div>
              <div class="author-box">
          <a href="https://scrollreader.com/author/edwinpaxtonhood/" class="author-link">
                        <img src="https://scrollreader.com/wp-content/uploads/male.webp"
                 width="140" height="140"
                 class="author-image small-author-image" />
            <div class="author-info">
              <h3>Edwin Paxton Hood</h3>
              <span>2 posts</span>
            </div>
          </a>
        </div>
              <div class="author-box">
          <a href="https://scrollreader.com/author/eglantonthorne/" class="author-link">
                        <img src="https://scrollreader.com/wp-content/uploads/women.webp"
                 width="140" height="140"
                 class="author-image small-author-image" />
            <div class="author-info">
              <h3>Eglanton Thorne</h3>
              <span>3 posts</span>
            </div>
          </a>
        </div>
              <div class="author-box">
          <a href="https://scrollreader.com/author/eleanorastooke/" class="author-link">
                        <img src="https://scrollreader.com/wp-content/uploads/women.webp"
                 width="140" height="140"
                 class="author-image small-author-image" />
            <div class="author-info">
              <h3>Eleanor H. Stooke</h3>
              <span>2 posts</span>
            </div>
          </a>
        </div>
              <div class="author-box">
          <a href="https://scrollreader.com/author/gcampbellmorgan/" class="author-link">
                        <img src="https://scrollreader.com/wp-content/uploads/campbellmorgan.webp"
                 width="140" height="140"
                 class="author-image small-author-image" />
            <div class="author-info">
              <h3>G. Campbell Morgan</h3>
              <span>2 posts</span>
            </div>
          </a>
        </div>
              <div class="author-box">
          <a href="https://scrollreader.com/author/gtbedell/" class="author-link">
                        <img src="https://scrollreader.com/wp-content/uploads/male.webp"
                 width="140" height="140"
                 class="author-image small-author-image" />
            <div class="author-info">
              <h3>G.T. Bedell</h3>
              <span>1 posts</span>
            </div>
          </a>
        </div>
              <div class="author-box">
          <a href="https://scrollreader.com/author/georgelasher/" class="author-link">
                        <img src="https://scrollreader.com/wp-content/uploads/male.webp"
                 width="140" height="140"
                 class="author-image small-author-image" />
            <div class="author-info">
              <h3>George Lasher</h3>
              <span>1 posts</span>
            </div>
          </a>
        </div>
              <div class="author-box">
          <a href="https://scrollreader.com/author/georgemuller/" class="author-link">
                        <img src="https://scrollreader.com/wp-content/uploads/georgemuller-profile.webp"
                 width="140" height="140"
                 class="author-image small-author-image" />
            <div class="author-info">
              <h3>George Müller</h3>
              <span>1 posts</span>
            </div>
          </a>
        </div>
              <div class="author-box">
          <a href="https://scrollreader.com/author/georgesmith/" class="author-link">
                        <img src="https://scrollreader.com/wp-content/uploads/male.webp"
                 width="140" height="140"
                 class="author-image small-author-image" />
            <div class="author-info">
              <h3>George Smith</h3>
              <span>1 posts</span>
            </div>
          </a>
        </div>
              <div class="author-box">
          <a href="https://scrollreader.com/author/haironside/" class="author-link">
                        <img src="https://scrollreader.com/wp-content/uploads/ironside.webp"
                 width="140" height="140"
                 class="author-image small-author-image" />
            <div class="author-info">
              <h3>H.A. Ironside</h3>
              <span>1 posts</span>
            </div>
          </a>
        </div>
              <div class="author-box">
          <a href="https://scrollreader.com/author/henryclaytrumbull/" class="author-link">
                        <img src="https://scrollreader.com/wp-content/uploads/1024-trumbull.webp"
                 width="140" height="140"
                 class="author-image small-author-image" />
            <div class="author-info">
              <h3>Henry Clay Trumbull</h3>
              <span>4 posts</span>
            </div>
          </a>
        </div>
              <div class="author-box">
          <a href="https://scrollreader.com/author/henryharrisjessup/" class="author-link">
                        <img src="https://scrollreader.com/wp-content/uploads/jessup-profile.webp"
                 width="140" height="140"
                 class="author-image small-author-image" />
            <div class="author-info">
              <h3>Henry Jessup</h3>
              <span>1 posts</span>
            </div>
          </a>
        </div>
              <div class="author-box">
          <a href="https://scrollreader.com/author/hesbastretton/" class="author-link">
                        <img src="https://scrollreader.com/wp-content/uploads/hesba.webp"
                 width="140" height="140"
                 class="author-image small-author-image" />
            <div class="author-info">
              <h3>Hesba Stretton</h3>
              <span>1 posts</span>
            </div>
          </a>
        </div>
              <div class="author-box">
          <a href="https://scrollreader.com/author/horatiusbonar/" class="author-link">
                        <img src="https://scrollreader.com/wp-content/uploads/Horatius_Bonar-1.webp"
                 width="140" height="140"
                 class="author-image small-author-image" />
            <div class="author-info">
              <h3>Horatius Bonar</h3>
              <span>4 posts</span>
            </div>
          </a>
        </div>
              <div class="author-box">
          <a href="https://scrollreader.com/author/hudsontaylor/" class="author-link">
                        <img src="https://scrollreader.com/wp-content/uploads/hudsontaylor-1.webp"
                 width="140" height="140"
                 class="author-image small-author-image" />
            <div class="author-info">
              <h3>Hudson Taylor</h3>
              <span>2 posts</span>
            </div>
          </a>
        </div>
              <div class="author-box">
          <a href="https://scrollreader.com/author/ichabodspencer/" class="author-link">
                        <img src="https://scrollreader.com/wp-content/uploads/ichabod-spencer.webp"
                 width="140" height="140"
                 class="author-image small-author-image" />
            <div class="author-info">
              <h3>Ichabod Spencer</h3>
              <span>2 posts</span>
            </div>
          </a>
        </div>
              <div class="author-box">
          <a href="https://scrollreader.com/author/isaacwatts/" class="author-link">
                        <img src="https://scrollreader.com/wp-content/uploads/isaac-watts.webp"
                 width="140" height="140"
                 class="author-image small-author-image" />
            <div class="author-info">
              <h3>Isaac Watts</h3>
              <span>1 posts</span>
            </div>
          </a>
        </div>
              <div class="author-box">
          <a href="https://scrollreader.com/author/jcryle/" class="author-link">
                        <img src="https://scrollreader.com/wp-content/uploads/jcryle.webp"
                 width="140" height="140"
                 class="author-image small-author-image" />
            <div class="author-info">
              <h3>J.C. Ryle</h3>
              <span>1 posts</span>
            </div>
          </a>
        </div>
              <div class="author-box">
          <a href="https://scrollreader.com/author/jehutton/" class="author-link">
                        <img src="https://beta.scrollreader.com/wp-content/uploads/male.webp"
                 width="140" height="140"
                 class="author-image small-author-image" />
            <div class="author-info">
              <h3>J.E. Hutton</h3>
              <span>2 posts</span>
            </div>
          </a>
        </div>
              <div class="author-box">
          <a href="https://scrollreader.com/author/jamesdabneymccabe/" class="author-link">
                        <img src="https://ill-be-honest.local/wp-content/uploads/2024/07/noprofile.jpg"
                 width="140" height="140"
                 class="author-image small-author-image" />
            <div class="author-info">
              <h3>James Dabney McCabe</h3>
              <span>1 posts</span>
            </div>
          </a>
        </div>
              <div class="author-box">
          <a href="https://scrollreader.com/author/jamesjellis/" class="author-link">
                        <img src="https://scrollreader.com/wp-content/uploads/male.webp"
                 width="140" height="140"
                 class="author-image small-author-image" />
            <div class="author-info">
              <h3>James Ellis</h3>
              <span>2 posts</span>
            </div>
          </a>
        </div>
              <div class="author-box">
          <a href="https://scrollreader.com/author/jamesgilmour/" class="author-link">
                        <img src="https://scrollreader.com/wp-content/uploads/jamesgilmour.webp"
                 width="140" height="140"
                 class="author-image small-author-image" />
            <div class="author-info">
              <h3>James Gilmour</h3>
              <span>1 posts</span>
            </div>
          </a>
        </div>
              <div class="author-box">
          <a href="https://scrollreader.com/author/jeanettegedalius/" class="author-link">
                        <img src="https://scrollreader.com/wp-content/uploads/Jeanette-Gedalius.webp"
                 width="140" height="140"
                 class="author-image small-author-image" />
            <div class="author-info">
              <h3>Jeanette Gedalius</h3>
              <span>1 posts</span>
            </div>
          </a>
        </div>
              <div class="author-box">
          <a href="https://scrollreader.com/author/jerrymcauley/" class="author-link">
                        <img src="https://scrollreader.com/wp-content/uploads/JerryMcAuley.webp"
                 width="140" height="140"
                 class="author-image small-author-image" />
            <div class="author-info">
              <h3>Jerry McAuley</h3>
              <span>1 posts</span>
            </div>
          </a>
        </div>
              <div class="author-box">
          <a href="https://scrollreader.com/author/jessepage/" class="author-link">
                        <img src="https://beta.scrollreader.com/wp-content/uploads/male.webp"
                 width="140" height="140"
                 class="author-image small-author-image" />
            <div class="author-info">
              <h3>Jesse Page</h3>
              <span>2 posts</span>
            </div>
          </a>
        </div>
              <div class="author-box">
          <a href="https://scrollreader.com/author/jimelliff/" class="author-link">
                        <img src="https://scrollreader.com/wp-content/uploads/jimeliff-1.webp"
                 width="140" height="140"
                 class="author-image small-author-image" />
            <div class="author-info">
              <h3>Jim Elliff</h3>
              <span>2 posts</span>
            </div>
          </a>
        </div>
              <div class="author-box">
          <a href="https://scrollreader.com/author/johnabbott/" class="author-link">
                        <img src="https://scrollreader.com/wp-content/uploads/johnabbott.webp"
                 width="140" height="140"
                 class="author-image small-author-image" />
            <div class="author-info">
              <h3>John Abbott</h3>
              <span>2 posts</span>
            </div>
          </a>
        </div>
              <div class="author-box">
          <a href="https://scrollreader.com/author/johnbell/" class="author-link">
                        <img src="https://scrollreader.com/wp-content/uploads/male.webp"
                 width="140" height="140"
                 class="author-image small-author-image" />
            <div class="author-info">
              <h3>John Bell</h3>
              <span>1 posts</span>
            </div>
          </a>
        </div>
              <div class="author-box">
          <a href="https://scrollreader.com/author/johnbunyan/" class="author-link">
                        <img src="https://scrollreader.com/wp-content/uploads/John_Bunyan_by_Thomas_Sadler_1684-1-1.webp"
                 width="140" height="140"
                 class="author-image small-author-image" />
            <div class="author-info">
              <h3>John Bunyan</h3>
              <span>3 posts</span>
            </div>
          </a>
        </div>
              <div class="author-box">
          <a href="https://scrollreader.com/author/johnflavel/" class="author-link">
                        <img src="https://scrollreader.com/wp-content/uploads/JohnFlavel-1.webp"
                 width="140" height="140"
                 class="author-image small-author-image" />
            <div class="author-info">
              <h3>John Flavel</h3>
              <span>1 posts</span>
            </div>
          </a>
        </div>
              <div class="author-box">
          <a href="https://scrollreader.com/author/johngpaton/" class="author-link">
                        <img src="https://scrollreader.com/wp-content/uploads/johngpaton-1.webp"
                 width="140" height="140"
                 class="author-image small-author-image" />
            <div class="author-info">
              <h3>John G. Paton</h3>
              <span>1 posts</span>
            </div>
          </a>
        </div>
              <div class="author-box">
          <a href="https://scrollreader.com/author/johnharris/" class="author-link">
                        <img src="https://scrollreader.com/wp-content/uploads/johnharris.webp"
                 width="140" height="140"
                 class="author-image small-author-image" />
            <div class="author-info">
              <h3>John Harris</h3>
              <span>1 posts</span>
            </div>
          </a>
        </div>
              <div class="author-box">
          <a href="https://scrollreader.com/author/johnhawthorn/" class="author-link">
                        <img src="https://ill-be-honest.local/wp-content/uploads/2024/07/noprofile.jpg"
                 width="140" height="140"
                 class="author-image small-author-image" />
            <div class="author-info">
              <h3>John Hawthorn</h3>
              <span>1 posts</span>
            </div>
          </a>
        </div>
              <div class="author-box">
          <a href="https://scrollreader.com/author/johnnevius/" class="author-link">
                        <img src="https://scrollreader.com/wp-content/uploads/john-nevius.webp"
                 width="140" height="140"
                 class="author-image small-author-image" />
            <div class="author-info">
              <h3>John Nevius</h3>
              <span>1 posts</span>
            </div>
          </a>
        </div>
              <div class="author-box">
          <a href="https://scrollreader.com/author/mabelwilliamson/" class="author-link">
                        <img src="https://beta.scrollreader.com/wp-content/uploads/women.webp"
                 width="140" height="140"
                 class="author-image small-author-image" />
            <div class="author-info">
              <h3>Mabel Williamson</h3>
              <span>1 posts</span>
            </div>
          </a>
        </div>
              <div class="author-box">
          <a href="https://scrollreader.com/author/macktomlinson/" class="author-link">
                        <img src="https://scrollreader.com/wp-content/uploads/pastor-mack-tomlinson-1.webp"
                 width="140" height="140"
                 class="author-image small-author-image" />
            <div class="author-info">
              <h3>Mack Tomlinson</h3>
              <span>1 posts</span>
            </div>
          </a>
        </div>
              <div class="author-box">
          <a href="https://scrollreader.com/author/marshallbroomhall/" class="author-link">
                        <img src="https://scrollreader.com/wp-content/uploads/marshallbroomhall.webp"
                 width="140" height="140"
                 class="author-image small-author-image" />
            <div class="author-info">
              <h3>Marshall Broomhall</h3>
              <span>2 posts</span>
            </div>
          </a>
        </div>
              <div class="author-box">
          <a href="https://scrollreader.com/author/maryslessor/" class="author-link">
                        <img src="https://scrollreader.com/wp-content/uploads/maryslessor.webp"
                 width="140" height="140"
                 class="author-image small-author-image" />
            <div class="author-info">
              <h3>Mary Slessor</h3>
              <span>1 posts</span>
            </div>
          </a>
        </div>
              <div class="author-box">
          <a href="https://scrollreader.com/author/matthewhenry/" class="author-link">
                        <img src="https://scrollreader.com/wp-content/uploads/MatthewHenry-scaled.webp"
                 width="140" height="140"
                 class="author-image small-author-image" />
            <div class="author-info">
              <h3>Matthew Henry</h3>
              <span>1 posts</span>
            </div>
          </a>
        </div>
              <div class="author-box">
          <a href="https://scrollreader.com/author/mildredcable/" class="author-link">
                        <img src="https://scrollreader.com/wp-content/uploads/women.webp"
                 width="140" height="140"
                 class="author-image small-author-image" />
            <div class="author-info">
              <h3>Mildred Cable</h3>
              <span>4 posts</span>
            </div>
          </a>
        </div>
              <div class="author-box">
          <a href="https://scrollreader.com/author/mrshowardtaylor/" class="author-link">
                        <img src="https://scrollreader.com/wp-content/uploads/mrshowardtaylor.webp"
                 width="140" height="140"
                 class="author-image small-author-image" />
            <div class="author-info">
              <h3>Mrs. Howard Taylor</h3>
              <span>1 posts</span>
            </div>
          </a>
        </div>
              <div class="author-box">
          <a href="https://scrollreader.com/author/mrsofwalton/" class="author-link">
                        <img src="https://scrollreader.com/wp-content/uploads/mrsofwalton-1.webp"
                 width="140" height="140"
                 class="author-image small-author-image" />
            <div class="author-info">
              <h3>Mrs. O.F. Walton</h3>
              <span>3 posts</span>
            </div>
          </a>
        </div>
              <div class="author-box">
          <a href="https://scrollreader.com/author/paulkanamori/" class="author-link">
                        <img src="https://scrollreader.com/wp-content/uploads/paul-kanamori.webp"
                 width="140" height="140"
                 class="author-image small-author-image" />
            <div class="author-info">
              <h3>Paul Kanamori</h3>
              <span>1 posts</span>
            </div>
          </a>
        </div>
              <div class="author-box">
          <a href="https://scrollreader.com/author/petercartwright/" class="author-link">
                        <img src="https://scrollreader.com/wp-content/uploads/peter-cartwright.webp"
                 width="140" height="140"
                 class="author-image small-author-image" />
            <div class="author-info">
              <h3>Peter Cartwright</h3>
              <span>2 posts</span>
            </div>
          </a>
        </div>
              <div class="author-box">
          <a href="https://scrollreader.com/author/philipdoddridge/" class="author-link">
                        <img src="https://scrollreader.com/wp-content/uploads/philipdoddridge.webp"
                 width="140" height="140"
                 class="author-image small-author-image" />
            <div class="author-info">
              <h3>Philip Doddridge</h3>
              <span>1 posts</span>
            </div>
          </a>
        </div>
              <div class="author-box">
          <a href="https://scrollreader.com/author/richardbaxter/" class="author-link">
                        <img src="https://scrollreader.com/wp-content/uploads/1024-richardbaxter.webp"
                 width="140" height="140"
                 class="author-image small-author-image" />
            <div class="author-info">
              <h3>Richard Baxter</h3>
              <span>1 posts</span>
            </div>
          </a>
        </div>
              <div class="author-box">
          <a href="https://scrollreader.com/author/richardnewton/" class="author-link">
                        <img src="https://scrollreader.com/wp-content/uploads/newton.webp"
                 width="140" height="140"
                 class="author-image small-author-image" />
            <div class="author-info">
              <h3>Richard Newton</h3>
              <span>2 posts</span>
            </div>
          </a>
        </div>
              <div class="author-box">
          <a href="https://scrollreader.com/author/robertchapman/" class="author-link">
                        <img src="https://scrollreader.com/wp-content/uploads/400-robertchapman-1.webp"
                 width="140" height="140"
                 class="author-image small-author-image" />
            <div class="author-info">
              <h3>Robert Chapman</h3>
              <span>1 posts</span>
            </div>
          </a>
        </div>
              <div class="author-box">
          <a href="https://scrollreader.com/author/robertphilip/" class="author-link">
                        <img src="https://scrollreader.com/wp-content/uploads/male.webp"
                 width="140" height="140"
                 class="author-image small-author-image" />
            <div class="author-info">
              <h3>Robert Philip</h3>
              <span>1 posts</span>
            </div>
          </a>
        </div>
              <div class="author-box">
          <a href="https://scrollreader.com/author/rolandallen/" class="author-link">
                        <img src="https://scrollreader.com/wp-content/uploads/rolandallen.jpg"
                 width="140" height="140"
                 class="author-image small-author-image" />
            <div class="author-info">
              <h3>Roland Allen</h3>
              <span>1 posts</span>
            </div>
          </a>
        </div>
              <div class="author-box">
          <a href="https://scrollreader.com/author/rosalindgoforth/" class="author-link">
                        <img src="https://scrollreader.com/wp-content/uploads/400-rosalind-goforth-1.webp"
                 width="140" height="140"
                 class="author-image small-author-image" />
            <div class="author-info">
              <h3>Rosalind Goforth</h3>
              <span>1 posts</span>
            </div>
          </a>
        </div>
              <div class="author-box">
          <a href="https://scrollreader.com/author/ruthlamb/" class="author-link">
                        <img src="https://scrollreader.com/wp-content/uploads/women.webp"
                 width="140" height="140"
                 class="author-image small-author-image" />
            <div class="author-info">
              <h3>Ruth Lamb</h3>
              <span>3 posts</span>
            </div>
          </a>
        </div>
              <div class="author-box">
          <a href="https://scrollreader.com/author/ryandenton/" class="author-link">
                        <img src="https://scrollreader.com/wp-content/uploads/ryandenton.webp"
                 width="140" height="140"
                 class="author-image small-author-image" />
            <div class="author-info">
              <h3>Ryan Denton</h3>
              <span>1 posts</span>
            </div>
          </a>
        </div>
              <div class="author-box">
          <a href="https://scrollreader.com/author/samuelchadwick/" class="author-link">
                        <img src="https://scrollreader.com/wp-content/uploads/chadwick.webp"
                 width="140" height="140"
                 class="author-image small-author-image" />
            <div class="author-info">
              <h3>Samuel Chadwick</h3>
              <span>1 posts</span>
            </div>
          </a>
        </div>
              <div class="author-box">
          <a href="https://scrollreader.com/author/thomasboston/" class="author-link">
                        <img src="https://scrollreader.com/wp-content/uploads/thomas-boston-1.webp"
                 width="140" height="140"
                 class="author-image small-author-image" />
            <div class="author-info">
              <h3>Thomas Boston</h3>
              <span>1 posts</span>
            </div>
          </a>
        </div>
              <div class="author-box">
          <a href="https://scrollreader.com/author/thomashooker/" class="author-link">
                        <img src="https://scrollreader.com/wp-content/uploads/thomas-hooker-1.webp"
                 width="140" height="140"
                 class="author-image small-author-image" />
            <div class="author-info">
              <h3>Thomas Hooker</h3>
              <span>1 posts</span>
            </div>
          </a>
        </div>
              <div class="author-box">
          <a href="https://scrollreader.com/author/thomaswatson/" class="author-link">
                        <img src="https://scrollreader.com/wp-content/uploads/thomaswatson.webp"
                 width="140" height="140"
                 class="author-image small-author-image" />
            <div class="author-info">
              <h3>Thomas Watson</h3>
              <span>1 posts</span>
            </div>
          </a>
        </div>
              <div class="author-box">
          <a href="https://scrollreader.com/author/williamalcott/" class="author-link">
                        <img src="https://scrollreader.com/wp-content/uploads/williamalcott.webp"
                 width="140" height="140"
                 class="author-image small-author-image" />
            <div class="author-info">
              <h3>William Alcott</h3>
              <span>1 posts</span>
            </div>
          </a>
        </div>
              <div class="author-box">
          <a href="https://scrollreader.com/author/williamwallaceeverts/" class="author-link">
                        <img src="https://scrollreader.com/wp-content/uploads/male.webp"
                 width="140" height="140"
                 class="author-image small-author-image" />
            <div class="author-info">
              <h3>William Everts</h3>
              <span>1 posts</span>
            </div>
          </a>
        </div>
              <div class="author-box">
          <a href="https://scrollreader.com/author/williamhatcher/" class="author-link">
                        <img src="https://scrollreader.com/wp-content/uploads/male.webp"
                 width="140" height="140"
                 class="author-image small-author-image" />
            <div class="author-info">
              <h3>William Hatcher</h3>
              <span>1 posts</span>
            </div>
          </a>
        </div>
              <div class="author-box">
          <a href="https://scrollreader.com/author/williamhuntington/" class="author-link">
                        <img src="https://scrollreader.com/wp-content/uploads/williamhuntingdon-1.webp"
                 width="140" height="140"
                 class="author-image small-author-image" />
            <div class="author-info">
              <h3>William Huntington</h3>
              <span>1 posts</span>
            </div>
          </a>
        </div>
              <div class="author-box">
          <a href="https://scrollreader.com/author/williamparsons/" class="author-link">
                        <img src="https://scrollreader.com/wp-content/uploads/male.webp"
                 width="140" height="140"
                 class="author-image small-author-image" />
            <div class="author-info">
              <h3>William Parsons</h3>
              <span>1 posts</span>
            </div>
          </a>
        </div>
              <div class="author-box">
          <a href="https://scrollreader.com/author/williamtyndale/" class="author-link">
                        <img src="https://scrollreader.com/wp-content/uploads/WilliamTyndale.webp"
                 width="140" height="140"
                 class="author-image small-author-image" />
            <div class="author-info">
              <h3>William Tyndale</h3>
              <span>1 posts</span>
            </div>
          </a>
        </div>
          </div>

  </div>
`;

const matches = [...html.matchAll(/<img\s+src="([^"]+)"[\s\S]*?<h3>([^<]+)<\/h3>/g)];

let authors = matches.map(m => {
  return {
    name: m[2].trim(),
    image: m[1].trim(),
    dates: "" // To be filled later
  };
});

// Since the user asked for a quick script let's write to public/data/authors.json
fs.writeFileSync(path.join(__dirname, '../public/data/authors.json'), JSON.stringify(authors, null, 2));

console.log('Parsed ' + authors.length + ' authors');
